<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->string('name')->default('Suscripción programada')->after('household_id');
            $table->foreignId('transfer_account_id')
                ->nullable()
                ->after('financial_account_id')
                ->constrained('financial_accounts')
                ->nullOnDelete();
            $table->enum('status', ['active', 'paused', 'archived'])
                ->default('active')
                ->after('amount')
                ->index();
            $table->foreignId('created_by')
                ->nullable()
                ->after('currency_id')
                ->constrained('users')
                ->nullOnDelete();
        });

        DB::table('recurring_transactions')
            ->whereNull('name')
            ->update(['name' => DB::raw("COALESCE(memo, 'Suscripción programada')")]);
    }

    public function down(): void
    {
        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transfer_account_id');
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn('name');
            $table->dropColumn('status');
        });
    }
};
