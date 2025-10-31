<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->foreignId('financial_account_id')->constrained('financial_accounts')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->nullOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->restrictOnDelete();
            $table->enum('type', ['income', 'expense', 'transfer'])->index();
            $table->decimal('amount', 15, 2);
            $table->enum('frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual'])->default('monthly');
            $table->unsignedTinyInteger('interval')->default(1);
            $table->json('custom_schedule')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->timestamp('next_occurrence_at')->nullable();
            $table->timestamp('last_occurrence_at')->nullable();
            $table->boolean('auto_commit')->default(true);
            $table->string('memo')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['household_id', 'frequency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_transactions');
    }
};
