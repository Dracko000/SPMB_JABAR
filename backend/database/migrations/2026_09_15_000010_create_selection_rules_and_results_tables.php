<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('selection_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->decimal('score_weight', 5, 3);
            $table->decimal('distance_weight', 5, 3);
            $table->enum('tie_break', ['date_submitted_asc', 'age_youngest'])->default('date_submitted_asc');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['admission_period_id', 'admission_path_id']);
        });

        Schema::create('selection_results', function (Blueprint $table) {
            $table->id();
            $table->uuid('run_id')->index();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->decimal('composite_score', 8, 4);
            $table->unsignedInteger('rank')->nullable();
            $table->enum('status', ['selected', 'not_selected'])->default('not_selected');
            $table->unsignedTinyInteger('priority_used');
            $table->timestamps();

            $table->index('registration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('selection_results');
        Schema::dropIfExists('selection_rules');
    }
};