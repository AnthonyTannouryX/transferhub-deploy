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
        if (Schema::hasTable('currencies')) {
            return;
        }

        Schema::create('currencies', function (Blueprint $table) {
            $table->string('code', 3)->primary(); // ISO currency code
            $table->string('name');
            $table->string('symbol', 10)->nullable();
            $table->boolean('is_active')->default(true);
            // don't add timestamps here if 2025_10_24_181318_add_timestamps_to_currencies_table.php does that
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
