<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    protected WhatsAppService $waService;

    public function __construct(WhatsAppService $waService)
    {
        $this->waService = $waService;
    }

    public function getSettings()
    {
        $settings = WhatsAppSetting::first() ?? new WhatsAppSetting();
        return response()->json(['data' => $settings]);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'access_token' => 'nullable|string',
            'phone_number_id' => 'nullable|string',
            'business_account_id' => 'nullable|string',
            'webhook_verify_token' => 'nullable|string',
            'callback_url' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $settings = WhatsAppSetting::first() ?? new WhatsAppSetting();
        $settings->fill($validated);
        $settings->save();

        return response()->json(['message' => 'Settings saved', 'data' => $settings]);
    }

    public function testConnection()
    {
        $result = $this->waService->testConnection();
        if (!$result['success']) {
            return response()->json(['message' => $result['error']], 400);
        }
        return response()->json(['message' => 'Connected', 'data' => $result['data']]);
    }

    public function getTemplates()
    {
        $result = $this->waService->getTemplates();
        if (!$result['success']) {
            return response()->json(['message' => $result['error']], 400);
        }
        return response()->json(['data' => $result['data'] ?? []]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'to' => 'required|string',
            'type' => 'required|in:template,freeform',
            'template_name' => 'required_if:type,template|string',
            'variables' => 'nullable|array',
            'text' => 'required_if:type,freeform|string|max:4096',
            'context_type' => 'nullable|string',
            'context_id' => 'nullable|integer',
        ]);

        $result = $this->waService->sendMessage($validated);

        if (!$result['success']) {
            return response()->json(['message' => $result['error']], 400);
        }

        WhatsAppMessage::create([
            'wa_message_id' => $result['data']['messages'][0]['id'] ?? null,
            'to_number' => $validated['to'],
            'direction' => 'outbound',
            'type' => $validated['type'],
            'status' => 'sent',
            'content' => $validated['text'] ?? $validated['template_name'],
            'template_name' => $validated['template_name'] ?? null,
            'template_variables' => $validated['variables'] ?? null,
            'context_type' => $validated['context_type'] ?? null,
            'context_id' => $validated['context_id'] ?? null,
            'meta_response' => $result['data'] ?? null,
            'sent_at' => now(),
        ]);

        return response()->json(['message' => 'Message sent', 'data' => $result['data']]);
    }

    public function sendToLead(Lead $lead, Request $request)
    {
        $request->merge(['to' => $lead->whatsapp_number ?? $lead->phone]);
        $request->merge(['context_type' => 'lead', 'context_id' => $lead->id]);
        return $this->sendMessage($request);
    }

    public function sendToCustomer(Customer $customer, Request $request)
    {
        $request->merge(['to' => $customer->whatsapp_number ?? $customer->phone]);
        $request->merge(['context_type' => 'customer', 'context_id' => $customer->id]);
        return $this->sendMessage($request);
    }

    public function getMessages(Request $request)
    {
        $messages = WhatsAppMessage::query()
            ->when($request->direction, fn ($q, $d) => $q->where('direction', $d))
            ->when($request->context_type, fn ($q, $t) => $q->where('context_type', $t))
            ->when($request->context_id, fn ($q, $id) => $q->where('context_id', $id))
            ->orderByDesc('created_at')
            ->paginate($request->perPage ?? 20);

        return response()->json(['data' => $messages]);
    }

    public function getLeadMessages(Lead $lead)
    {
        $messages = WhatsAppMessage::where(function ($q) use ($lead) {
            $q->where('context_type', 'lead')
              ->where('context_id', $lead->id);
        })->orWhere(function ($q) use ($lead) {
            $q->where('to_number', $lead->phone)
              ->orWhere('to_number', $lead->whatsapp_number);
        })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $messages]);
    }

    public function getWebhookStatus()
    {
        $result = $this->waService->getWebhookStatus();
        return response()->json(['data' => $result]);
    }

    /* ---------- Public Webhook Endpoints ---------- */

    public function verifyWebhook(Request $request)
    {
        $settings = WhatsAppSetting::first();
        $verifyToken = $settings?->webhook_verify_token ?? env('WHATSAPP_VERIFY_TOKEN', 'default-token');

        $mode = $request->hub_mode;
        $token = $request->hub_verify_token;
        $challenge = $request->hub_challenge;

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('WhatsApp webhook verified');
            return response($challenge, 200);
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }

    public function receiveWebhook(Request $request)
    {
        $data = $request->all();
        Log::info('WhatsApp webhook received', $data);

        $entries = $data['entry'] ?? [];
        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $value = $change['value'] ?? [];
                $messages = $value['messages'] ?? [];
                $statuses = $value['statuses'] ?? [];

                foreach ($messages as $msg) {
                    $this->processIncomingMessage($msg, $value);
                }

                foreach ($statuses as $status) {
                    $this->processStatusUpdate($status);
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }

    protected function processIncomingMessage(array $msg, array $value)
    {
        $from = $msg['from'] ?? null;
        $type = $msg['type'] ?? 'text';
        $content = '';

        switch ($type) {
            case 'text':
                $content = $msg['text']['body'] ?? '';
                break;
            case 'image':
                $content = '[Image] ' . ($msg['image']['caption'] ?? '');
                break;
            case 'document':
                $content = '[Document] ' . ($msg['document']['filename'] ?? '');
                break;
            case 'audio':
                $content = '[Audio/Voice]';
                break;
            default:
                $content = "[$type]";
        }

        $waMessage = WhatsAppMessage::create([
            'wa_message_id' => $msg['id'] ?? null,
            'to_number' => $value['metadata']['phone_number_id'] ?? null,
            'from_number' => $from,
            'direction' => 'inbound',
            'type' => $type,
            'status' => 'received',
            'content' => $content,
            'meta_response' => $msg,
        ]);

        if ($from) {
            $lead = Lead::where('phone', $from)
                ->orWhere('whatsapp_number', $from)
                ->first();
            if ($lead) {
                $waMessage->update([
                    'context_type' => 'lead',
                    'context_id' => $lead->id,
                ]);
            }
        }
    }

    protected function processStatusUpdate(array $status)
    {
        $messageId = $status['id'] ?? null;
        $statusValue = $status['status'] ?? 'unknown';

        if (!$messageId) {
            return;
        }

        $waMessage = WhatsAppMessage::where('wa_message_id', $messageId)->first();
        if (!$waMessage) {
            return;
        }

        $update = ['status' => $statusValue];

        if ($statusValue === 'delivered') {
            $update['delivered_at'] = now();
        } elseif ($statusValue === 'read') {
            $update['read_at'] = now();
        }

        $waMessage->update($update);
    }
}
