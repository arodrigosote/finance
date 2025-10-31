<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_account_id')->constrained('financial_accounts')->cascadeOnDelete();
            $table->date('balance_date');
            $table->decimal('closing_balance', 15, 2);
            $table->decimal('cleared_balance', 15, 2)->nullable();
            $table->timestamp('calculated_at')->nullable();
            $table->enum('source', ['manual', 'import', 'reconciliation'])->default('manual');
            $table->json('snapshot')->nullable();
            $table->timestamps();

            $table->unique(['financial_account_id', 'balance_date'], 'account_balance_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_balances');
    }
};
