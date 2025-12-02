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
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('stripe_payment_method_id')->nullable()->after('card_cvv');
            $table->string('card_brand')->nullable()->after('stripe_payment_method_id');
            $table->string('last4')->nullable()->after('card_brand');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['stripe_payment_method_id', 'card_brand', 'last4']);
        });
    }
};
