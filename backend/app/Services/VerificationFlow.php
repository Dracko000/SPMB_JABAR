<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\User;
use App\Models\Verification;
use App\Support\Audit;

/**
 * operator_sekolah reviews school-scoped submissions (PRD §20). Every
 * transition is signed in the audit log and pinned in verifications.
 */
class VerificationFlow
{
    public function review(
        Registration $registration,
        User $actor,
        string $status,
        ?string $catatan = null,
    ): Verification {
        if (! in_array($status, ['valid', 'ditolak', 'perbaikan'], true)) {
            throw new \InvalidArgumentException('Status verifikasi tidak valid.');
        }

        // scope: operator only reviews a registration whose choices include their school
        $scoped = $registration->choices()->where('school_id', $actor->school_id)->exists();

        if (! $scoped) {
            abort(403, 'Registrasi ini tidak mengajukan ke sekolah Anda.');
        }

        $verification = Verification::create([
            'registration_id' => $registration->id,
            'actor_id' => $actor->id,
            'status' => $status,
            'catatan' => $catatan,
        ]);

        $registration->update(['status' => $status === 'valid' ? 'verified' : $status]);

        Audit::log('registration.verified', [
            'registration_id' => $registration->id,
            'status' => $status,
            'catatan' => $catatan,
        ]);

        return $verification;
    }
}