<?php

namespace App\Engines;

use App\Models\Registration;
use App\Services\DistanceService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class VerificationEngine
{
    public function __construct(private readonly DistanceService $distance) {}

    /**
     * Run initial automated verification on a registration.
     */
    public function run(Registration $registration): void
    {
        Log::info("VerificationEngine: Running initial check for Reg #{$registration->id}");

        $student = $registration->user->student;
        $address = $student->address;
        $errors = [];

        // 1. Cek Kelengkapan Data Integrasi
        if (empty($student->nik)) {
            $errors[] = 'NIK belum terverifikasi.';
        }

        // 2. Cek Umur (Simulasi: Minimal 12 tahun)
        if ($student->tanggal_lahir) {
            $birthDate = Carbon::parse($student->tanggal_lahir);
            if ($birthDate->diffInYears(now()) < 12) {
                $errors[] = 'Usia siswa tidak memenuhi syarat minimum.';
            }
        }

        // 3. Hitung Jarak Domisili untuk Pilihan Sekolah Utama (Zonasi Support)
        $firstChoice = $registration->choices->first();
        if ($firstChoice && $address && $firstChoice->school) {
            $school = $firstChoice->school;
            if ($address->latitude && $address->longitude && $school->latitude && $school->longitude) {
                $dist = $this->distance->calculate(
                    (float) $address->latitude, (float) $address->longitude,
                    (float) $school->latitude, (float) $school->longitude
                );
                $student->update(['jarak_domisili_km' => $dist]);
                Log::info("VerificationEngine: Calculated distance for Reg #{$registration->id}: {$dist} km");
            } else {
                Log::warning("VerificationEngine: Missing coordinates for Reg #{$registration->id}");
            }
        }

        // 4. Cek Dokumen Wajib berdasarkan Jalur
        $requiredDocs = $this->getRequiredDocsForPath($registration->admission_path_id);
        $uploadedDocs = $registration->documents()->pluck('type')->toArray();

        foreach ($requiredDocs as $docType) {
            if (! in_array($docType, $uploadedDocs)) {
                $errors[] = "Dokumen {$docType} wajib diunggah untuk jalur ini.";
            }
        }

        if (! empty($errors)) {
            $registration->update([
                'status' => 'perlu_perbaikan',
                'verification_notes' => implode(' | ', $errors),
            ]);
            Log::warning("VerificationEngine: Registration #{$registration->id} failed initial check: ".implode(', ', $errors));
        } else {
            $registration->update([
                'status' => 'terverifikasi_awal',
            ]);
            Log::info("VerificationEngine: Registration #{$registration->id} passed initial check.");
        }
    }

    /**
     * Get mandatory document types based on admission path.
     */
    private function getRequiredDocsForPath(int $pathId): array
    {
        return match ($pathId) {
            1 => ['KK', 'Ijazah'], // Zonasi
            2 => ['KK', 'KIP', 'SKTM'], // Afirmasi
            3 => ['KK', 'Sertifikat_Prestasi'], // Prestasi
            4 => ['KK', 'Surat_Mutasi'], // Mutasi
            default => ['KK'],
        };
    }
}
