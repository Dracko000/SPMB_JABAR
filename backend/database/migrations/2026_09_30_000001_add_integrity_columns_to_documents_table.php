<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sidik jari integritas dokumen (anti pemalsuan / pengubahan berkas):
     *  - sha256 / size_bytes / mime / original_name → direkam saat unggah,
     *  - verified_sha256 / verified_at → kunci hash yang DISETUJUI verifikator.
     * Berkas yang berubah setelah unggah = hash tidak cocok = indikasi
     * pengubahan dokumen, dan stempel valid tidak akan pernah menempel
     * pada berkas selain byte yang persis disetujui.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->char('sha256', 64)->nullable()->after('path');
            $table->unsignedBigInteger('size_bytes')->nullable()->after('sha256');
            $table->string('mime', 100)->nullable()->after('size_bytes');
            $table->string('original_name', 255)->nullable()->after('mime');
            $table->char('verified_sha256', 64)->nullable()->after('original_name');
            $table->timestamp('verified_at')->nullable()->after('verified_sha256');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            foreach (['sha256', 'size_bytes', 'mime', 'original_name', 'verified_sha256', 'verified_at'] as $col) {
                if (Schema::hasColumn('documents', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};