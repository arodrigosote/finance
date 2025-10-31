<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->decimal('amount', 15, 2);
            $table->decimal('percentage', 5, 2)->nullable();
            $table->unsignedInteger('sequence')->default(0);
            $table->string('memo')->nullable();
            $table->timestamps();

            $table->index(['transaction_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_splits');
    }
};
