<?php

namespace Database\Seeders;

use App\Models\PublicDownload;
use Illuminate\Database\Seeder;

class PublicDownloadsSeeder extends Seeder
{
    public function run(): void
    {
        $downloads = [
            // REGULASI
            [
                'title' => 'Peraturan Gubernur Jawa Barat tentang PPDB SMA/SMK 2026',
                'file_path' => 'downloads/pergub_ppdb_2026.pdf',
                'category' => 'Regulasi',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'Keputusan Kepala Dinas Pendidikan Jabar tentang Kuota Sekolah',
                'file_path' => 'downloads/kepdisdik_kuota_2026.pdf',
                'category' => 'Regulasi',
                'version' => '1.0',
                'is_active' => true,
            ],

            // JUKNIS & PANDUAN
            [
                'title' => 'Petunjuk Teknis (Juknis) PPDB SMA/SMK Jawa Barat 2026',
                'file_path' => 'downloads/juknis_ppdb_2026.pdf',
                'category' => 'Juknis',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'Panduan Pendaftaran Online Portal SPMB JABAR',
                'file_path' => 'downloads/panduan_pendaftaran.pdf',
                'category' => 'Panduan',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'Panduan Verifikasi Berkas untuk Operator Sekolah',
                'file_path' => 'downloads/panduan_operator.pdf',
                'category' => 'Panduan',
                'version' => '1.0',
                'is_active' => true,
            ],

            // TEMPLAT & FORMULIR
            [
                'title' => 'Templat Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
                'file_path' => 'downloads/form_sptjm.pdf',
                'category' => 'Templat',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'Format Surat Keterangan Domisili (RT/RW)',
                'file_path' => 'downloads/form_domisili.pdf',
                'category' => 'Templat',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'Format Surat Keterangan Penghasilan Orang Tua (Afirmasi)',
                'file_path' => 'downloads/form_penghasilan.pdf',
                'category' => 'Templat',
                'version' => '1.0',
                'is_active' => true,
            ],

            // PENGUMUMAN & INFO
            [
                'title' => 'Pengumuman Jadwal Pelaksanaan PPDB Jawa Barat 2026',
                'file_path' => 'downloads/pengumuman_jadwal.pdf',
                'category' => 'Pengumuman',
                'version' => '1.1',
                'is_active' => true,
            ],
            [
                'title' => 'Surat Edaran Tata Cara Verifikasi Dokumen Domisili',
                'file_path' => 'downloads/se_verifikasi_domisili.pdf',
                'category' => 'Pengumuman',
                'version' => '1.0',
                'is_active' => true,
            ],
            [
                'title' => 'FAQ - Tanya Jawab Seputar PPDB 2026',
                'file_path' => 'downloads/faq_ppdb_2026.pdf',
                'category' => 'Info',
                'version' => '1.2',
                'is_active' => true,
            ],
        ];

        foreach ($downloads as $download) {
            PublicDownload::updateOrCreate(
                ['title' => $download['title']],
                $download
            );
        }
    }
}
