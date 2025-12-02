<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change the default value of subscription_status from 'free' to 'active'
        DB::statement("ALTER TABLE users ALTER COLUMN subscription_status SET DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the default value back to 'free'
        DB::statement("ALTER TABLE users ALTER COLUMN subscription_status SET DEFAULT 'free'");
    }
};
