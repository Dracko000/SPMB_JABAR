<?php

namespace App\Services;

use App\Integration\DataIntegrationGateway;
use App\Integration\Exceptions\StudentNotFoundException;
use App\Integration\StudentRecord;
use App\Models\OtpCode;
use App\Models\Student;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * NISN → OTP → session (PRD §7.1, P0). OTP is hashed, attempt-bound,
 * expiring, and every step is audit-logged.
 */
class AuthFlow
{
    public function __construct(private readonly DataIntegrationGateway $gateway) {}

    /**
     * Step 1 — validate NISN, read student via gateway.
     *
     * @throws StudentNotFoundException
     */
    public function lookup(string $nisn): StudentRecord
    {
        $record = $this->gateway->lookupByNisn($nisn);

        Audit::log('auth.nisn.lookup', ['nisn' => $nisn, 'found' => true]);

        return $record;
    }

    /**
     * Step 2 — issue an OTP. Returns the request token (front end keeps it to
     * bind the verify step). Code itself is never stored in plaintext.
     */
    public function sendOtp(string $nisn): string
    {
        $code = (string) random_int(100000, 999999);

        OtpCode::where('nisn', $nisn)->whereNull('verified_at')->update(['expires_at' => now()]);

        $token = Str::random(32);

        OtpCode::create([
            'nisn' => $nisn,
            'code_hash' => Hash::make($code),
            'request_token' => $token,
            'attempts' => 0,
            'expires_at' => now()->addMinutes(5),
        ]);

        // Phase 1: mailer=log — the code is printed to storage/logs/laravel.log,
        // and surfaced via the debug/dev notice. Real SMS gateway swaps in here.
        logger()->channel('stack')->info("OTP untuk NISN {$nisn}", [
            'kode' => $code,
        ]);

        Audit::log('auth.otp.sent', ['nisn' => $nisn]);

        return $token;
    }

    /**
     * Step 3 — verify OTP and open a `pendaftar` session bound to the student.
     *
     * @throws \RuntimeException
     */
    public function verifyOtp(string $nisn, string $code, string $requestToken): User
    {
        $otp = OtpCode::where('nisn', $nisn)
            ->where('request_token', $requestToken)
            ->whereNull('verified_at')
            ->orderByDesc('id')
            ->first();

        if (! $otp) {
            throw new \RuntimeException('Permintaan OTP tidak valid. Silakan kirim ulang.');
        }

        if ($otp->expires_at->isPast()) {
            throw new \RuntimeException('Kode OTP sudah kedaluwarsa. Silakan kirim ulang.');
        }

        if ($otp->attempts >= 5) {
            throw new \RuntimeException('Terlalu banyak percobaan. Silakan kirim ulang kode OTP.');
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');
            Audit::log('auth.otp.failed', ['nisn' => $nisn]);
            throw new \RuntimeException('Kode OTP salah.');
        }

        $otp->update(['verified_at' => now()]);

        $student = Student::where('nisn', $nisn)->first();
        if (! $student) {
            throw new \RuntimeException('Data peserta tidak ditemukan.');
        }

        /** @var User $user */
        $user = User::firstOrCreate(
            ['student_id' => $student->id],
            [
                'name' => $student->nama,
                'email' => "{$nisn}@peserta.spmb.jabar",
                'password' => Hash::make(Str::random(32)),
                'role' => 'pendaftar',
            ],
        );

        Audit::log('auth.otp.verified', ['nisn' => $nisn, 'student_id' => $student->id]);

        return $user;
    }
}