<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->enum('type', ['income', 'expense', 'transfer'])->index();
            $table->string('name');
            $table->string('slug');
            $table->string('color', 7)->nullable();
            $table->boolean('is_archived')->default(false);
            $table->unsignedInteger('display_order')->default(0);
            $table->json('rules')->nullable();
            $table->timestamps();

            $table->unique(['household_id', 'slug']);
            $table->index(['household_id', 'type', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
