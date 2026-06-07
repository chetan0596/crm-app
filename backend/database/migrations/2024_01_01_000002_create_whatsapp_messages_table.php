<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->string('wa_message_id')->nullable()->index();
            $table->string('to_number');
            $table->string('from_number')->nullable();
            $table->enum('direction', ['outbound', 'inbound'])->default('outbound');
            $table->string('type'); // template | text | image | document
            $table->string('status')->default('sent'); // sent | delivered | read | failed | received
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
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
