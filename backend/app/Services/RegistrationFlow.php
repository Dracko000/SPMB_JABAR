<?php

namespace App\Services;

use App\Engines\VerificationEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\User;
use App\Support\Audit;
use App\Support\NotificationBus;

/**
 * Registration drafting + submission (PRD §15/17/18). Quota is reserved
 * transactionally at submit, not on draft save.
 */
class RegistrationFlow
{
    public function __construct(
        private readonly QuotaService $quota,
        private readonly VerificationEngine $verification,
        private readonly NotificationBus $notifications,
    ) {}

    public function activePeriod(): ?AdmissionPeriod
    {
        return AdmissionPeriod::where('is_active', true)->first();
    }

    /**
     * Get the pendaftar's submission; create a draft if none.
     */
    public function draftOrCreate(User $user): Registration
    {
        $period = $this->activePeriod();
        if (! $period) {
            throw new \RuntimeException('Belum ada periode pendaftaran aktif.');
        }

        return Registration::firstOrCreate(
            [
                'user_id' => $user->id,
                'admission_period_id' => $period->id,
            ],
            [
                'no_pendaftaran' => $this->generateNoPendaftaran(),
                'student_id' => $user->student_id,
                'admission_path_id' => null,
                'status' => 'draft',
            ],
        );
    }

    public function pickPath(Registration $registration, string $pathCode): Registration
    {
        $path = AdmissionPath::where('code', $pathCode)->where('is_active', true)->first();
        if (! $path) {
            throw new \RuntimeException('Jalur tidak dikenal.');
        }

        $registration->update(['admission_path_id' => $path->id]);

        Audit::log('registration.path', ['registration_id' => $registration->id, 'path' => $pathCode], $registration);

        return $registration;
    }

    /**
     * Replace the school choices wholesale. Priorities 1..n from request order.
     */
    public function setChoices(Registration $registration, array $schoolIds): Registration
    {
        $registration->choices()->delete();

        foreach (array_values(array_unique(array_filter($schoolIds))) as $i => $schoolId) {
            RegistrationChoice::create([
                'registration_id' => $registration->id,
                'school_id' => (int) $schoolId,
                'priority' => $i + 1,
            ]);
        }

        return $registration->fresh();
    }

    /**
     * Submit — validates mandatory documents, reserves quota for each choice atomically.
     * Idempotent: a submitted registration re-submits nothing.
     */
    public function submit(Registration $registration): Registration
    {
        if (in_array($registration->status, ['submitted', 'terverifikasi_awal', 'verified', 'ditolak'], true)) {
            return $registration;
        }

        if (! $registration->admission_path_id) {
            throw new \RuntimeException('Pilih jalur pendaftaran terlebih dahulu.');
        }

        if ($registration->choices()->count() === 0) {
            throw new \RuntimeException('Pilih minimal satu sekolah tujuan.');
        }

        // Validate mandatory documents before submitting
        $this->validateMandatoryDocuments($registration);

        foreach ($registration->choices as $choice) {
            $this->quota->reserve($choice->school_id, $registration->admission_path_id);
        }

        $registration->update(['status' => 'submitted']);

        // Run automated verification to determine if it's 'terverifikasi_awal' or 'perlu_perbaikan'
        $this->verification->run($registration->fresh());

        if ($registration->user_id) {
            $this->notifications->dispatch('registration.submitted', $registration->user_id, [
                'registration_id' => $registration->id,
                'no_pendaftaran' => $registration->no_pendaftaran,
            ]);
        }

        Audit::log('registration.submitted', ['registration_id' => $registration->id], $registration);

        return $registration->fresh();
    }

    /**
     * Ensure all mandatory documents for the selected path are uploaded.
     *
     * @throws \RuntimeException
     */
    private function validateMandatoryDocuments(Registration $registration): void
    {
        // This mirrors logic in VerificationEngine but blocks the 'submit' action
        $mandatoryDocs = match ($registration->admission_path_id) {
            1 => ['KK', 'Ijazah'], // Zonasi
            2 => ['KK', 'KIP', 'SKTM'], // Afirmasi
            3 => ['KK', 'Sertifikat_Prestasi'], // Prestasi
            4 => ['KK', 'Surat_Mutasi'], // Mutasi
            default => ['KK'],
        };

        $uploadedDocs = $registration->documents()->pluck('type')->toArray();
        $missing = array_diff($mandatoryDocs, $uploadedDocs);

        if (! empty($missing)) {
            throw new \RuntimeException('Dokumen wajib belum lengkap: '.implode(', ', $missing));
        }
    }

    private function generateNoPendaftaran(): string
    {
        $period = $this->activePeriod();
        $year = $period?->year ?? now()->year;

        return 'SPMB'.$year.sprintf('%08d', random_int(1, 99_999_999));
    }
}
