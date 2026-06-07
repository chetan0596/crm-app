<?php

use App\Http\Controllers\Api\V1\WhatsAppController;
use Illuminate\Support\Facades\Route;

/* WhatsApp Integration Routes */

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

/* Public Webhook Endpoints (no auth — called by Meta) */
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'verifyWebhook']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'receiveWebhook']);
