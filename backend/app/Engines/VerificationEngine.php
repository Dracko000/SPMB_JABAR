<?php

namespace App\Engines;

use App\Integration\DataIntegrationGateway;
use App\Models\Registration;
use App\Support\Audit;

/**
 * Advisory verification at submit-time (PRD §12). Compares the confirmed
 * student fields against the gateway's canonical record. Writes evidence +
 * verdict to registrations.verification_evidence but does NOT transition
 * status — the operator's review() remains the status authority.
 */
final class VerificationEngine
{
    public function __construct(private readonly DataIntegrationGateway $gateway) {}

    public function run(Registration $registration): array
    {
        $student = $registration->student;
        $record = $this->gateway->lookupByNisn($student->nisn);

        $comparators = [
            'nisn' => [$student->nisn, $record->nisn],
            'nik' => [$student->nik, $record->nik],
            'nama' => [$student->nama, $record->nama],
            'tempat_lahir' => [$student->tempat_lahir, $record->tempatLahir],
            'tanggal_lahir' => [$student->tanggal_lahir?->toDateString(), $record->tanggalLahir?->toDateString()],
            'jenis_kelamin' => [$student->jenis_kelamin, $record->jenisKelamin],
            'sekolah_asal' => [$student->educationRecord?->sekolah_asal, $record->sekolahAsal],
            'nama_ayah' => [$student->parent?->nama_ayah, $record->namaAyah],
            'nama_ibu' => [$student->parent?->nama_ibu, $record->namaIbu],
        ];

        $fields = [];
        $anyFail = false;
        $hasSkips = false;

        foreach ($comparators as $key => [$submitted, $source]) {
            if ($submitted === null || $source === null) {
                $fields[$key] = 'SKIP';
                $hasSkips = true;
                continue;
            }
            $match = strtolower(trim((string) $submitted)) === strtolower(trim((string) $source));
            $fields[$key] = $match ? 'PASS' : 'FAIL';
            $anyFail = $anyFail || ! $match;
        }

        // Design doc §3 / brief Interface line: only an ALL-PASS comparison is
        // VALID; any SKIP (partial evidence, even without FAIL) needs review.
        $verdict = $anyFail
            ? 'DATA TIDAK SESUAI'
            : ($hasSkips ? 'PERLU VERIFIKASI' : 'VALID');

        $registration->update([
            'verification_evidence' => [
                'verdict' => $verdict,
                'fields' => $fields,
                'run_at' => now()->toIso8601String(),
            ],
        ]);

        Audit::log('registration.verified_engine', [
            'registration_id' => $registration->id,
            'verdict' => $verdict,
        ]);

        return $fields;
    }
}
