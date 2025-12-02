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
        Schema::table('agent_stores', function (Blueprint $table) {
            $table->decimal('cash_balance', 15, 2)->default(0)->after('opening_hours');
            $table->string('cash_currency', 3)->default('USD')->after('cash_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agent_stores', function (Blueprint $table) {
            $table->dropColumn(['cash_balance', 'cash_currency']);
        });
    }
};
