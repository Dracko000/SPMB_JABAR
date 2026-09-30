<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Penguncian rantai identitas NISN → NIK → data diri:
     *  - students.identity_hash: sidik jari (sha256 dari nisn|nik|tanggal_lahir)
     *    yang DIKUNCI saat akun pendaftar pertama diklaim lewat OTP. Setelah
     *    terkunci, sinkron identitas dari gateway yang BERUBAH (nik/TTL beda)
     *    terdeteksi sebagai drift dan tidak menimpa data asli.
     *  - users.demo_login: penanda bahwa akun sengaja boleh login dengan
     *    NISN sebagai kata sandi (HANYA akun demo/uji). Akun siswa operasional
     *    tidak akan pernah memakai pola itu — NISN bukan kredensial.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->char('identity_hash', 64)->nullable()->after('nik');
            $table->timestamp('identity_bound_at')->nullable()->after('identity_hash');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('demo_login')->default(false)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['identity_hash', 'identity_bound_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('demo_login');
        });
    }
};