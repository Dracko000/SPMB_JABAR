<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\User;
use App\Models\Verification;
use App\Support\Audit;
use App\Support\NotificationBus;
use Illuminate\Support\Facades\DB;

/**
 * operator_sekolah reviews school-scoped submissions (PRD §20). Every
 * transition is signed in the audit log and pinned in verifications.
 */
class VerificationFlow
{
    public function __construct(
        private readonly NotificationBus $notifications,
        private readonly QuotaService $quota,
    ) {}

    public function review(
        Registration $registration,
        User $actor,
        string $status,
        ?string $catatan = null,
    ): Verification {
        if (! in_array($status, ['valid', 'ditolak', 'perbaikan'], true)) {
            throw new \InvalidArgumentException('Status verifikasi tidak valid.');
        }

        // A rejected registration is terminal and a draft is not reviewable —
        // repeated/duplicate reviews would otherwise re-release seats already
        // freed (double-click submit, or another school re-reviewing the row).
        if (! in_array($registration->status, ['submitted', 'perbaikan', 'verified'], true)) {
            throw new \InvalidArgumentException('Registrasi ini tidak dapat diverifikasi ulang.');
        }

        // scope: operator only reviews a registration whose choices include their school
        $scoped = $registration->choices()->where('school_id', $actor->school_id)->exists();

        if (! $scoped) {
            abort(403, 'Registrasi ini tidak mengajukan ke sekolah Anda.');
        }

        // Verify + free seats atomically: a failure mid-loop must not leave a
        // registration re-statused while its reserved seats stay stuck.
        $verification = DB::transaction(function () use ($registration, $actor, $status, $catatan) {
            $verification = Verification::create([
                'registration_id' => $registration->id,
                'actor_id' => $actor->id,
                'status' => $status,
                'catatan' => $catatan,
            ]);

            $registration->update(['status' => $status === 'valid' ? 'verified' : $status]);

            // Rejected/needs-revision registrations free their reserved seats so
            // the pool reflects only live reservations. A nontransitional
            // registration is dead at every path; a perbaikan resubmission
            // re-reserves via RegistrationFlow::submit.
            if ($status !== 'valid') {
                foreach ($registration->choices as $choice) {
                    $this->quota->release((int) $choice->school_id, (int) $registration->admission_path_id);
                }
            }

            return $verification;
        });

        Audit::log('registration.verified', [
            'registration_id' => $registration->id,
            'status' => $status,
            'catatan' => $catatan,
        ]);

        if ($registration->user_id) {
            $this->notifications->dispatch(
                $status === 'valid' ? 'registration.verified' : ($status === 'ditolak' ? 'registration.rejected' : 'document.revision'),
                $registration->user_id,
                ['registration_id' => $registration->id, 'status' => $status],
            );
        }

        return $verification;
    }
}