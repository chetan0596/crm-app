<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppSetting extends Model
{
    protected $fillable = [
        'access_token',
        'phone_number_id',
        'business_account_id',
        'webhook_verify_token',
        'callback_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
