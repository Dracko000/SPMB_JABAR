<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('no_pendaftaran', 30)->unique();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('draft'); // draft | submitted | verified | rejected | selected
            $table->timestamps();
        });

        Schema::create('registration_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('priority');
            $table->timestamps();

            $table->unique(['registration_id', 'school_id']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30); // ijazah | rapor | akte | kk | ...
            $table->string('path', 255);
            $table->string('status', 20)->default('belum'); // belum | menunggu | valid | ditolak | perbaikan
            $table->string('catatan', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20);
            $table->string('catatan', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifications');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('registration_choices');
        Schema::dropIfExists('registrations');
    }
};