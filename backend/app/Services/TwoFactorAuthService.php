<?php

namespace App\Services;

use PragmaRX\Google2FALaravel\Google2FA;

class TwoFactorAuthService
{
    protected $google2fa;

    public function __construct(Google2FA $google2fa)
    {
        $this->google2fa = $google2fa;
    }

    /**
     * Generate a new 2FA secret for the user.
     */
    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Generate a QR Code URL for the user.
     */
    public function getQrCodeUrl($user): string
    {
        $google2fa = new \PragmaRX\Google2FA\Google2FA;

        return $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email ?? $user->username,
            $this->generateSecretFromUser($user)
        );
    }

    /**
     * Verify the OTP code provided by the user.
     */
    public function verifyOtp(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code);
    }

    private function generateSecretFromUser($user): string
    {
        return $user->google2fa_secret ?? $this->generateSecret();
    }
}
