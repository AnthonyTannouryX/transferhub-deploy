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
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('nickname');
            $table->text('account_details')->nullable()->after('payment_method');
            $table->boolean('is_verified')->default(false)->after('account_details');
            $table->integer('total_transfers')->default(0)->after('is_verified');
            $table->timestamp('last_transfer_date')->nullable()->after('total_transfers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method',
                'account_details', 
                'is_verified',
                'total_transfers',
                'last_transfer_date'
            ]);
        });
    }
};
