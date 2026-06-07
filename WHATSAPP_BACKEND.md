# WhatsApp Integration — Backend API Contract

This document describes the Laravel backend endpoints required to support the Meta Business API WhatsApp integration.

---

## 1. Database Migrations

### `whatsapp_settings` table
```php
Schema::create('whatsapp_settings', function (Blueprint $table) {
    $table->id();
    $table->string('access_token')->nullable();
    $table->string('phone_number_id')->nullable();
    $table->string('business_account_id')->nullable();
    $table->string('webhook_verify_token')->nullable();
    $table->string('callback_url')->nullable();
    $table->boolean('is_active')->default(false);
    $table->timestamps();
});
```

### `whatsapp_messages` table
```php
Schema::create('whatsapp_messages', function (Blueprint $table) {
    $table->id();
    $table->string('wa_message_id')->nullable()->index(); // Meta message ID
    $table->string('to_number');
    $table->string('from_number')->nullable();
    $table->enum('direction', ['outbound', 'inbound'])->default('outbound');
    $table->string('type'); // template | text | image | document
    $table->string('status')->default('sent'); // sent | delivered | read | failed
    $table->text('content');
    $table->string('template_name')->nullable();
    $table->json('template_variables')->nullable();
    $table->string('context_type')->nullable(); // lead | sale | purchase | payment | customer
    $table->unsignedBigInteger('context_id')->nullable();
    $table->json('meta_response')->nullable();
    $table->timestamp('sent_at')->nullable();
    $table->timestamp('delivered_at')->nullable();
    $table->timestamp('read_at')->nullable();
    $table->timestamps();

    $table->index(['context_type', 'context_id']);
    $table->index(['to_number', 'created_at']);
});
```

### Add `whatsapp_number` to existing tables
```php
// customers table
Schema::table('customers', function (Blueprint $table) {
    $table->string('whatsapp_number')->nullable()->after('phone');
});

// leads table
Schema::table('leads', function (Blueprint $table) {
    $table->string('whatsapp_number')->nullable()->after('phone');
});
```

---

## 2. Routes (`routes/api_v1.php`)

```php
use App\Http\Controllers\Api\V1\WhatsAppController;

Route::middleware('auth:api')->group(function () {
    Route::get('/whatsapp/settings', [WhatsAppController::class, 'getSettings']);
    Route::post('/whatsapp/settings', [WhatsAppController::class, 'saveSettings']);
    Route::post('/whatsapp/test-connection', [WhatsAppController::class, 'testConnection']);
    Route::get('/whatsapp/templates', [WhatsAppController::class, 'getTemplates']);
    Route::post('/whatsapp/send', [WhatsAppController::class, 'sendMessage']);
    Route::post('/whatsapp/send/lead/{lead}', [WhatsAppController::class, 'sendToLead']);
    Route::post('/whatsapp/send/customer/{customer}', [WhatsAppController::class, 'sendToCustomer']);
    Route::get('/whatsapp/messages', [WhatsAppController::class, 'getMessages']);
    Route::get('/whatsapp/messages/lead/{lead}', [WhatsAppController::class, 'getLeadMessages']);
    Route::get('/whatsapp/webhook-status', [WhatsAppController::class, 'getWebhookStatus']);
});

// Public webhook endpoints (no auth — called by Meta)
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'verifyWebhook']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'receiveWebhook']);
```

---

## 3. Controller (`app/Http/Controllers/Api/V1/WhatsAppController.php`)

```php
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

        // Store in DB
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
            ->when($request->direction, fn($q, $d) => $q->where('direction', $d))
            ->when($request->context_type, fn($q, $t) => $q->where('context_type', $t))
            ->when($request->context_id, fn($q, $id) => $q->where('context_id', $id))
            ->orderByDesc('created_at')
            ->paginate($request->perPage ?? 20);

        return response()->json(['data' => $messages]);
    }

    public function getLeadMessages(Lead $lead)
    {
        $messages = WhatsAppMessage::where('context_type', 'lead')
            ->where('context_id', $lead->id)
            ->orWhere(function ($q) use ($lead) {
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

    // --- Webhook endpoints (public, no auth) ---

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

        // Process incoming messages
        $entries = $data['entry'] ?? [];
        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $value = $change['value'] ?? [];
                $messages = $value['messages'] ?? [];
                $statuses = $value['statuses'] ?? [];

                // Incoming messages
                foreach ($messages as $msg) {
                    $this->processIncomingMessage($msg, $value);
                }

                // Status updates
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

        // Auto-link to lead if phone matches
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

        if (!$messageId) return;

        $waMessage = WhatsAppMessage::where('wa_message_id', $messageId)->first();
        if (!$waMessage) return;

        $update = ['status' => $statusValue];

        if ($statusValue === 'delivered') {
            $update['delivered_at'] = now();
        } elseif ($statusValue === 'read') {
            $update['read_at'] = now();
        }

        $waMessage->update($update);
    }
}
```

---

## 4. Service (`app/Services/WhatsAppService.php`)

```php
<?php

namespace App\Services;

use App\Models\WhatsAppSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected ?WhatsAppSetting $settings;
    protected string $baseUrl = 'https://graph.facebook.com/v18.0';

    public function __construct()
    {
        $this->settings = WhatsAppSetting::first();
    }

    protected function getToken(): ?string
    {
        return $this->settings?->access_token;
    }

    protected function getPhoneNumberId(): ?string
    {
        return $this->settings?->phone_number_id;
    }

    public function testConnection(): array
    {
        if (!$this->getToken() || !$this->getPhoneNumberId()) {
            return ['success' => false, 'error' => 'Missing token or phone number ID'];
        }

        $url = "{$this->baseUrl}/{$this->getPhoneNumberId()}";
        $response = Http::withToken($this->getToken())->get($url);

        if ($response->successful()) {
            return ['success' => true, 'data' => $response->json()];
        }

        return ['success' => false, 'error' => $response->json('error.message', 'Connection failed')];
    }

    public function getTemplates(): array
    {
        if (!$this->getToken() || !$this->getPhoneNumberId()) {
            return ['success' => false, 'error' => 'Not configured'];
        }

        $url = "{$this->baseUrl}/{$this->getPhoneNumberId()}/message_templates";
        $response = Http::withToken($this->getToken())->get($url);

        if ($response->successful()) {
            $data = $response->json('data', []);
            return ['success' => true, 'data' => $data];
        }

        return ['success' => false, 'error' => $response->json('error.message', 'Failed to fetch templates')];
    }

    public function sendMessage(array $payload): array
    {
        if (!$this->getToken() || !$this->getPhoneNumberId()) {
            return ['success' => false, 'error' => 'WhatsApp not configured'];
        }

        $to = $this->formatPhone($payload['to']);
        $url = "{$this->baseUrl}/{$this->getPhoneNumberId()}/messages";

        $body = ['messaging_product' => 'whatsapp', 'recipient_type' => 'individual', 'to' => $to];

        if ($payload['type'] === 'template') {
            $body['type'] = 'template';
            $body['template'] = [
                'name' => $payload['template_name'],
                'language' => ['code' => 'en'],
            ];
            if (!empty($payload['variables'])) {
                $body['template']['components'] = [
                    [
                        'type' => 'body',
                        'parameters' => array_map(fn($v) => ['type' => 'text', 'text' => $v], $payload['variables']),
                    ],
                ];
            }
        } else {
            $body['type'] = 'text';
            $body['text'] = ['body' => $payload['text']];
        }

        $response = Http::withToken($this->getToken())
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        if ($response->successful()) {
            return ['success' => true, 'data' => $response->json()];
        }

        Log::error('WhatsApp send failed', [
            'to' => $to,
            'response' => $response->json(),
            'status' => $response->status(),
        ]);

        return ['success' => false, 'error' => $response->json('error.message', 'Send failed')];
    }

    public function getWebhookStatus(): array
    {
        $result = $this->testConnection();
        if (!$result['success']) {
            return ['connected' => false, 'error' => $result['error']];
        }

        $data = $result['data'] ?? [];
        return [
            'connected' => true,
            'verified' => true,
            'phone_number' => $data['display_phone_number'] ?? null,
            'quality_rating' => $data['quality_rating'] ?? null,
            'messages_sent_today' => 0, // You can query this from Meta analytics API
        ];
    }

    protected function formatPhone(string $phone): string
    {
        // Remove all non-numeric except leading +
        $clean = preg_replace('/[^\d+]/', '', $phone);
        if (!str_starts_with($clean, '+')) {
            // Default to India if no country code
            $clean = '+91' . ltrim($clean, '0');
        }
        return $clean;
    }
}
```

---

## 5. Models

### `app/Models/WhatsAppSetting.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppSetting extends Model
{
    protected $fillable = [
        'access_token', 'phone_number_id', 'business_account_id',
        'webhook_verify_token', 'callback_url', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
```

### `app/Models/WhatsAppMessage.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    protected $fillable = [
        'wa_message_id', 'to_number', 'from_number', 'direction', 'type',
        'status', 'content', 'template_name', 'template_variables',
        'context_type', 'context_id', 'meta_response',
        'sent_at', 'delivered_at', 'read_at',
    ];

    protected $casts = [
        'template_variables' => 'array',
        'meta_response' => 'array',
    ];
}
```

---

## 6. Environment Variables (`.env`)

```
WHATSAPP_VERIFY_TOKEN=your-random-webhook-verify-token
```

---

## 7. Meta Business Setup Steps

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a Business App
3. Add **WhatsApp** product to the app
4. Go to **API Setup** → copy:
   - **Access Token** (generate a permanent one)
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
5. Configure webhook:
   - Callback URL: `https://your-domain.com/api/v1/whatsapp/webhook`
   - Verify Token: match what's in your `.env`
   - Subscribe to: `messages`, `message_statuses`
6. Register phone number and verify it
7. Create message templates in Meta Business Manager for outbound messaging
8. Paste the token & phone ID into the CRM WhatsApp Settings page

---

## 8. Permissions Required

Add these permissions to your roles/permissions system:
- `whatsapp-settings-view` — Access settings page
- `whatsapp-send` — Send messages
- `whatsapp-view-messages` — View message history
