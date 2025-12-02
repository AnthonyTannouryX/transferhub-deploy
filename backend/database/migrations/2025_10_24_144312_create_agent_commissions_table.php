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
        // Prevent duplicate table error if it already exists
        if (Schema::hasTable('agent_commissions')) {
            return;
        }

        Schema::create('agent_commissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('agent_store_id');
            $table->uuid('transaction_id')->nullable();

            $table->enum('transaction_type', ['cash_in', 'cash_out', 'transfer'])->index();
            $table->decimal('amount', 15, 2);
            $table->decimal('commission_rate', 8, 4); // Store as decimal (e.g., 0.025 for 2.5%)
            $table->decimal('commission_amount', 15, 2);
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending')->index();

            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('agent_store_id')
                  ->references('id')
                  ->on('agent_stores')
                  ->onDelete('cascade');

            $table->foreign('transaction_id')
                  ->references('id')
                  ->on('transfers')
                  ->onDelete('set null');

            $table->index(['agent_store_id', 'status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_commissions');
    }
};
