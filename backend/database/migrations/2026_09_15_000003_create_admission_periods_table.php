<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admission_periods', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->timestamp('registration_start');
            $table->timestamp('registration_end');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('admission_paths', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_period_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('kuota');
            $table->unsignedInteger('terisi')->default(0);
            $table->timestamps();

            $table->unique(['school_id', 'admission_path_id']);
        });

        Schema::create('requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name', 100);
            $table->boolean('required')->default(true);
            $table->timestamps();

            $table->unique(['admission_path_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirements');
        Schema::dropIfExists('quotas');
        Schema::dropIfExists('admission_paths');
        Schema::dropIfExists('admission_periods');
    }
};
