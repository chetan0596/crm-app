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

        $body = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
        ];

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
                        'parameters' => array_map(
                            fn ($v) => ['type' => 'text', 'text' => $v],
                            $payload['variables']
                        ),
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
            'messages_sent_today' => 0,
        ];
    }

    protected function formatPhone(string $phone): string
    {
        $clean = preg_replace('/[^\d+]/', '', $phone);
        if (!str_starts_with($clean, '+')) {
            $clean = '+91' . ltrim($clean, '0');
        }
        return $clean;
    }
}
