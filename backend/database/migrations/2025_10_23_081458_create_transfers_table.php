<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Avoid duplicate table error if it already exists
        if (Schema::hasTable('transfers')) {
            return;
        }

        Schema::create('transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transfer_reference')->unique();
            $table->uuid('sender_id');
            $table->uuid('beneficiary_id');
            $table->decimal('amount_sent', 15, 2);
            $table->string('currency_sent', 3);
            $table->decimal('amount_received', 15, 2);
            $table->string('currency_received', 3);
            $table->decimal('exchange_rate', 15, 8);
            $table->decimal('transfer_fee', 15, 2)->default(0);

            $table->enum('status', [
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
            ])->default('pending');

            $table->uuid('agent_store_id')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('sender_id')->references('id')->on('users');
            $table->foreign('beneficiary_id')->references('id')->on('beneficiaries');
            $table->foreign('currency_sent')->references('code')->on('currencies');
            $table->foreign('currency_received')->references('code')->on('currencies');
            $table->foreign('agent_store_id')->references('id')->on('agent_stores');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
