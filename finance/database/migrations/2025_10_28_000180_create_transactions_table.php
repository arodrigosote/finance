<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->foreignId('financial_account_id')->constrained('financial_accounts')->cascadeOnDelete();
            $table->foreignId('transfer_account_id')->nullable()->constrained('financial_accounts')->nullOnDelete();
            $table->foreignId('primary_category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->restrictOnDelete();
            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->nullOnDelete();
            $table->foreignId('recurring_transaction_id')->nullable()->constrained('recurring_transactions')->nullOnDelete();
            $table->string('external_reference')->nullable();
            $table->enum('type', ['income', 'expense', 'transfer'])->index();
            $table->enum('status', ['pending', 'posted', 'reconciled', 'void'])->default('posted')->index();
            $table->decimal('amount', 15, 2);
            $table->decimal('converted_amount', 15, 2)->nullable();
            $table->decimal('running_balance', 15, 2)->nullable();
            $table->boolean('is_split')->default(false);
            $table->boolean('is_cleared')->default(false);
            $table->timestamp('booked_at');
            $table->timestamp('posted_at')->nullable();
            $table->timestamp('cleared_at')->nullable();
            $table->string('description')->nullable();
            $table->string('notes', 1024)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['household_id', 'booked_at']);
            $table->index(['financial_account_id', 'booked_at'], 'transactions_account_booked_index');
            $table->index(['external_reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
