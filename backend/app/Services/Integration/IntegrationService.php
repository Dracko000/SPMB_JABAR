<?php

namespace App\Services\Integration;

use Exception;
use Illuminate\Support\Facades\Log;

class IntegrationService
{
    /**
     * Simulasi verifikasi NISN ke Gateway Pemerintah.
     *
     * @throws Exception
     */
    public function verifyNisn(string $nisn): bool
    {
        Log::info("IntegrationService: Verifying NISN {$nisn}");

        // Simulasi: NISN valid jika panjangnya 10 digit
        if (strlen($nisn) !== 10 || ! ctype_digit($nisn)) {
            Log::warning("IntegrationService: Invalid NISN format {$nisn}");

            return false;
        }

        // Simulasi: NISN yang dimulai dengan '000' dianggap tidak ditemukan
        if (str_starts_with($nisn, '000')) {
            return false;
        }

        return true;
    }

    /**
     * Simulasi penarikan data lengkap siswa dari Gateway Pemerintah.
     */
    public function fetchStudentData(string $nisn): ?array
    {
        Log::info("IntegrationService: Fetching full data for NISN {$nisn}");

        // Simulasi response dari API Pemerintah
        // Dalam production, ini akan memanggil HTTP Client (Http::get(...))
        return [
            'identity' => [
                'nisn' => $nisn,
                'nik' => '3215'.str_pad(rand(1, 99999999), 8, '0', STR_PAD_LEFT).'123',
                'nama' => 'Siswa Simulasi '.$nisn,
                'tanggal_lahir' => '2009-05-20',
                'jenis_kelamin' => rand(0, 1) ? 'L' : 'P',
                'agama' => 'Islam',
                'status_peserta' => 'calon',
            ],
            'address' => [
                'alamat' => 'Jl. Raya Pendidikan No. 123, Jawa Barat',
                'region_id' => 1, // Asumsi region ID 1 = Jabar
                'rt' => '001',
                'rw' => '002',
            ],
            'parents' => [
                'nama_ayah' => 'Ayah Simulasi',
                'nama_ibu' => 'Ibu Simulasi',
                'pekerjaan_ayah' => 'Karyawan',
                'pekerjaan_ibu' => 'IRT',
            ],
            'education' => [
                'sekolah_asal' => 'SMP Negeri 1 Simulasi',
                'nis_asal' => 'NPSN12345',
                'tahun_lulus' => 2024,
            ],
        ];
    }
}
