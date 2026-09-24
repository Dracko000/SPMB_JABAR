<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hak verifikasi global untuk peran superadmin & akun yang diberi
     * wewenang: dapat melihat & menilai (acc) SEMUA pendaftar di semua
     * sekolah, bukan hanya yang memilih sekolahnya sendiri.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_verify_all')->default(false)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_verify_all');
        });
    }
};