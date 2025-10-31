<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->restrictOnDelete();
            $table->string('name');
            $table->enum('period_type', ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'])->default('monthly');
            $table->date('period_start');
            $table->date('period_end');
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->boolean('rollover_enabled')->default(false);
            $table->decimal('target_amount', 15, 2)->default(0);
            $table->decimal('actual_amount', 15, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['household_id', 'name', 'period_start', 'period_end'], 'budget_unique_period');
            $table->index(['household_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
