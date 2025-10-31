<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->restrictOnDelete();
            $table->string('name');
            $table->enum('type', ['cash', 'checking', 'savings', 'credit', 'investment', 'loan', 'wallet', 'other'])->index();
            $table->enum('status', ['active', 'archived', 'closed'])->default('active')->index();
            $table->string('institution_name')->nullable();
            $table->string('account_number_last4', 4)->nullable();
            $table->string('display_color', 7)->nullable();
            $table->decimal('initial_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->decimal('interest_rate', 8, 4)->nullable();
            $table->date('opened_on')->nullable();
            $table->date('closed_on')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['household_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_accounts');
    }
};
