<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Legacy migration. Logic replaced by 2025_10_24_150223_modify_beneficiaries_table_for_wallet_transfers.
        // No-op to avoid duplicate column / FK issues.
    }

    public function down(): void
    {
        // No-op
    }
};
