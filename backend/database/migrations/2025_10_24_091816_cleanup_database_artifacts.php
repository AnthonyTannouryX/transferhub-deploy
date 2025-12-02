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
        // Clean up any leftover columns from our previous implementations
        
        // Remove account_type from beneficiaries table if it exists
        if (Schema::hasTable('beneficiaries') && Schema::hasColumn('beneficiaries', 'account_type')) {
            Schema::table('beneficiaries', function (Blueprint $table) {
                $table->dropColumn('account_type');
            });
        }
        
        // Remove account fields from users table if they exist
        if (Schema::hasTable('users')) {
            $columnsToRemove = ['account_type', 'account_details', 'country'];
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('users', $column)) {
                    Schema::table('users', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                }
            }
        }
        
        // Remove user_balances table if it exists
        if (Schema::hasTable('user_balances')) {
            Schema::dropIfExists('user_balances');
        }
        
        // Remove transfer fields if they exist
        if (Schema::hasTable('transfers')) {
            $transferColumnsToRemove = [
                'transfer_type', 
                'funding_method', 
                'virtual_card_id', 
                'agent_cash_in_id', 
                'agent_cash_out_id', 
                'notes', 
                'initiated_at', 
                'processed_at'
            ];
            
            foreach ($transferColumnsToRemove as $column) {
                if (Schema::hasColumn('transfers', $column)) {
                    Schema::table('transfers', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is for cleanup only, so we don't need to reverse it
        // The down method is intentionally left empty
    }
};
