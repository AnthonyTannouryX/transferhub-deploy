<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserSubscriptionsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // If the table already exists (ex: existing DB on Render), don't recreate it
        if (Schema::hasTable('user_subscriptions')) {
            return;
        }

        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('plan_id');
            $table->enum('status', ['active', 'cancelled', 'expired', 'pending', 'trial'])->default('active');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->decimal('amount_paid', 10, 2)->nullable(); // For custom enterprise plans
            $table->string('payment_method')->nullable(); // 'stripe', 'paypal', 'bank_transfer'
            $table->string('external_subscription_id')->nullable(); // Stripe/PayPal subscription ID
            $table->json('metadata')->nullable(); // Additional plan-specific data
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('cascade');

            // Ensure one active subscription per user (you can adjust this if needed)
            $table->unique(['user_id', 'status'], 'unique_active_subscription');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_subscriptions');
    }
}
