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
        Schema::table('stripe_transactions', function (Blueprint $table) {
            // First, drop the foreign key constraint
            $table->dropForeign(['wallet_id']);
        });
        
        Schema::table('stripe_transactions', function (Blueprint $table) {
            // Change wallet_id to nullable
            $table->uuid('wallet_id')->nullable()->change();
        });
        
        Schema::table('stripe_transactions', function (Blueprint $table) {
            // Re-add the foreign key with set null on delete
            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_transactions', function (Blueprint $table) {
            $table->dropForeign(['wallet_id']);
        });
        
        Schema::table('stripe_transactions', function (Blueprint $table) {
            $table->uuid('wallet_id')->nullable(false)->change();
        });
        
        Schema::table('stripe_transactions', function (Blueprint $table) {
            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('cascade');
        });
    }
};
