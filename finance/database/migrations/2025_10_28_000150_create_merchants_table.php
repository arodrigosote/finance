<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained('households')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('category_hint')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['household_id', 'slug']);
            $table->index(['household_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchants');
    }
};
