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
        private readonly NotificationService $notifier,
    ) {}

    public function review(
        Registration $registration,
        User $actor,
        string $status,
        ?string $catatan = null,
        array $flags = [],
    ): Verification {
        if (! in_array($status, ['valid', 'ditolak', 'perbaikan'], true)) {
            throw new \InvalidArgumentException('Status verifikasi tidak valid.');
        }

        // A rejected registration is terminal and a draft is not reviewable —
        // repeated/duplicate reviews would otherwise re-release seats already
        // freed (double-click submit, or another school re-reviewing the row).
        // 'terverifikasi_awal' is included: auto-verified submissions still need
        // the operator's document/address sign-off (review → valid/ditolak/perbaikan).
        if (! in_array($registration->status, ['submitted', 'terverifikasi_awal', 'perbaikan', 'verified'], true)) {
            throw new \InvalidArgumentException('Registrasi ini tidak dapat diverifikasi ulang.');
        }

        // scope: operator only reviews a registration whose choices include their school
        $scoped = $registration->choices()->where('school_id', $actor->school_id)->exists();

        if (! $scoped) {
            abort(403, 'Registrasi ini tidak mengajukan ke sekolah Anda.');
        }

        // Verify + free seats atomically: a failure mid-loop must not leave a
        // registration re-statused while its reserved seats stay stuck. The
        // document flags are written here too — only after the scope check
        // above, so an out-of-scope reviewer can never touch the row.
        $verification = DB::transaction(function () use ($registration, $actor, $status, $catatan, $flags) {
            $verification = Verification::create([
                'registration_id' => $registration->id,
                'actor_id' => $actor->id,
                'status' => $status,
                'catatan' => $catatan,
            ]);

            $update = ['status' => $status === 'valid' ? 'verified' : $status];

            // Whitelist — only the three review flags may come through.
            foreach (['is_kk_verified', 'is_ijazah_verified', 'is_alamat_verified'] as $key) {
                if (array_key_exists($key, $flags)) {
                    $update[$key] = (bool) $flags[$key];
                }
            }

            $registration->update($update);

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
        ], $registration);

        if ($registration->user_id) {
            // 1. Internal Notification (App/Database)
            $this->notifications->dispatch(
                $status === 'valid' ? 'registration.verified' : ($status === 'ditolak' ? 'registration.rejected' : 'document.revision'),
                $registration->user_id,
                ['registration_id' => $registration->id, 'status' => $status],
            );

            // 2. External Notification (Email/WA Proxy)
            $this->notifier->notifyStatusChange(
                $registration,
                $status === 'valid' ? 'verified' : $status,
                $catatan
            );
        }

        return $verification;
    }
}
