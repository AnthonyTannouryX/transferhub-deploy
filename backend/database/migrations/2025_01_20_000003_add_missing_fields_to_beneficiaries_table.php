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
        // If payment_method already exists (like on the existing Render DB), skip this migration
        if (Schema::hasColumn('beneficiaries', 'payment_method')) {
            return;
        }

        Schema::table('beneficiaries', function (Blueprint $table) {
            $table->string('payment_method')->nullable();
            $table->text('account_details')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->integer('total_transfers')->default(0);
            $table->timestamp('last_transfer_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            if (Schema::hasColumn('beneficiaries', 'payment_method')) {
                $table->dropColumn('payment_method');
            }

            if (Schema::hasColumn('beneficiaries', 'account_details')) {
                $table->dropColumn('account_details');
            }

            if (Schema::hasColumn('beneficiaries', 'is_verified')) {
                $table->dropColumn('is_verified');
            }

            if (Schema::hasColumn('beneficiaries', 'total_transfers')) {
                $table->dropColumn('total_transfers');
            }

            if (Schema::hasColumn('beneficiaries', 'last_transfer_date')) {
                $table->dropColumn('last_transfer_date');
            }
        });
    }
};
