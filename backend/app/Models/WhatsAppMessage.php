<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    protected $fillable = [
        'wa_message_id',
        'to_number',
        'from_number',
        'direction',
        'type',
        'status',
        'content',
        'template_name',
        'template_variables',
        'context_type',
        'context_id',
        'meta_response',
        'sent_at',
        'delivered_at',
        'read_at',
    ];

    protected $casts = [
        'template_variables' => 'array',
        'meta_response' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];
}
