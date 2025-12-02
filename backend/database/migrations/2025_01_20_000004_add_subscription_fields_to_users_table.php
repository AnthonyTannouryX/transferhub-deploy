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
        Schema::table('users', function (Blueprint $table) {
            // Use Laravel's default email verification column name
            $table->uuid('current_plan_id')->nullable()->after('email_verified_at');

            $table->enum('subscription_status', [
                'free',
                'active',
                'cancelled',
                'expired',
                'trial',
            ])->default('free')->after('current_plan_id');

            $table->timestamp('subscription_expires_at')
                  ->nullable()
                  ->after('subscription_status');

            $table->boolean('auto_renew')
                  ->default(true)
                  ->after('subscription_expires_at');

            $table->foreign('current_plan_id')
                  ->references('id')
                  ->on('subscription_plans')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_plan_id']);
            $table->dropColumn([
                'current_plan_id',
                'subscription_status',
                'subscription_expires_at',
                'auto_renew',
            ]);
        });
    }
};
