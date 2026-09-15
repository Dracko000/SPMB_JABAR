<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('tempat_lahir', 150)->nullable()->after('nama');
            $table->decimal('nilai_prestasi', 5, 2)->nullable()->after('agama');
            $table->decimal('jarak_domisili_km', 7, 2)->nullable()->after('nilai_prestasi');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->json('verification_evidence')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['tempat_lahir', 'nilai_prestasi', 'jarak_domisili_km']);
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('verification_evidence');
        });
    }
};