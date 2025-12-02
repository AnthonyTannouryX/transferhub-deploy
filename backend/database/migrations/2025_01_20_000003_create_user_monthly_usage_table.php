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
        Schema::create('user_monthly_usage', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('month_year', 7); // '2024-12' format
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->integer('transfer_count')->default(0);
            $table->decimal('total_fees_paid', 10, 2)->default(0);
            $table->json('usage_breakdown')->nullable(); // Daily usage stats
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Ensure one record per user per month
            $table->unique(['user_id', 'month_year'], 'unique_user_month');
            
            // Index for performance
            $table->index(['user_id', 'month_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_monthly_usage');
    }
};
