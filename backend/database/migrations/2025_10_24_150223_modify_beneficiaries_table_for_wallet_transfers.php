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
            // ✅ Add new fields for wallet-to-wallet transfers ONLY if they don't already exist
            if (!Schema::hasColumn('beneficiaries', 'beneficiary_user_id')) {
                $table->uuid('beneficiary_user_id')->after('user_id');
            }

            if (!Schema::hasColumn('beneficiaries', 'nickname')) {
                $table->string('nickname')->nullable()->after('beneficiary_user_id');
            }

            // Add foreign key + index only if column exists (and assume not yet constrained)
            if (Schema::hasColumn('beneficiaries', 'beneficiary_user_id')) {
                try {
                    $table->foreign('beneficiary_user_id')
                        ->references('id')
                        ->on('users')
                        ->onDelete('cascade');
                } catch (\Throwable $e) {
                    // ignore if FK already exists
                }

                try {
                    $table->index(['user_id', 'beneficiary_user_id']);
                } catch (\Throwable $e) {
                    // ignore if index already exists
                }
            }

            // ✅ Remove old fields only if they still exist
            $columnsToDrop = ['email', 'phone', 'country', 'account_details'];

            $existingToDrop = array_filter($columnsToDrop, function ($column) {
                return Schema::hasColumn('beneficiaries', $column);
            });

            if (!empty($existingToDrop)) {
                try {
                    $table->dropColumn($existingToDrop);
                } catch (\Throwable $e) {
                    // ignore if some columns are already dropped
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table) {
            // Only try to remove things if the new column is there
            if (Schema::hasColumn('beneficiaries', 'beneficiary_user_id')) {
                try {
                    $table->dropForeign(['beneficiary_user_id']);
                } catch (\Throwable $e) {
                    // ignore if FK already gone
                }

                try {
                    $table->dropIndex(['user_id', 'beneficiary_user_id']);
                } catch (\Throwable $e) {
                    // ignore if index already gone
                }

                try {
                    $table->dropColumn(['beneficiary_user_id', 'nickname']);
                } catch (\Throwable $e) {
                    // ignore if already dropped
                }
            }

            // Restore original fields only if missing
            if (!Schema::hasColumn('beneficiaries', 'email')) {
                $table->string('email')->nullable();
            }

            if (!Schema::hasColumn('beneficiaries', 'phone')) {
                $table->string('phone')->nullable();
            }

            if (!Schema::hasColumn('beneficiaries', 'country')) {
                $table->string('country', 3);
            }

            if (!Schema::hasColumn('beneficiaries', 'account_details')) {
                $table->text('account_details');
            }
        });
    }
};
