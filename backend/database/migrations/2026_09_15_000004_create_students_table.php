<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('nisn', 10)->unique();
            $table->string('nik', 16)->unique();
            $table->string('nama', 150);
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('agama', 30)->nullable();
            $table->string('status_peserta', 30)->default('calon');
            $table->string('source', 30)->default('mock');
            $table->timestamps();
        });

        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('nama_ayah', 150)->nullable();
            $table->string('nama_ibu', 150)->nullable();
            $table->string('pekerjaan_ayah', 100)->nullable();
            $table->string('pekerjaan_ibu', 100)->nullable();
            $table->timestamps();
            $table->unique('student_id');
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->text('alamat')->nullable();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->string('rt', 6)->nullable();
            $table->string('rw', 6)->nullable();
            $table->timestamps();
            $table->unique('student_id');
        });

        Schema::create('education_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('sekolah_asal', 200)->nullable();
            $table->string('nis_asal', 30)->nullable();
            $table->integer('tahun_lulus')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_records');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('students');
    }
};