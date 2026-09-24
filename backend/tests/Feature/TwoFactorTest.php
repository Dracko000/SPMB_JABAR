<?php

use App\Models\User;
use PragmaRX\Google2FALaravel\Google2FA;

/**
 * Two-factor auth for admin roles (PRD — admin panel must be gated behind OTP).
 * The TwoFactorMiddleware only triggers for admin_provinsi / admin_kabkota who
 * have enrolled a google2fa_secret, and the session flag resets each login.
 */
function tfa_AdminWithSecret(array $overrides = []): User
{
    $admin = User::where('role', 'admin_provinsi')->firstOrFail()->fresh();
    $admin->update(array_merge([
        'password' => 'password',
        'google2fa_secret' => app(Google2FA::class)->generateSecretKey(),
    ], $overrides));

    return $admin;
}

function tfa_CurrentOtp(User $admin): string
{
    return app(Google2FA::class)->getCurrentOtp($admin->google2fa_secret);
}

it('redirects an admin with 2FA enrolled to the verification page after login', function () {
    $admin = tfa_AdminWithSecret();

    $this->post('/login', ['identifier' => $admin->email, 'password' => 'password'])
        ->assertRedirect('/auth/two-factor/verify');
});

it('does not require 2FA when the admin has no secret enrolled', function () {
    $admin = tfa_AdminWithSecret(['google2fa_secret' => null]);

    $this->post('/login', ['identifier' => $admin->email, 'password' => 'password'])
        ->assertRedirect('/admin');

    $this->assertAuthenticatedAs($admin);
});

it('blocks admin routes until the OTP is verified', function () {
    $admin = tfa_AdminWithSecret();

    $this->actingAs($admin)->get('/admin')
        ->assertRedirect('/auth/two-factor/verify');
});

it('verifies a valid OTP and unlocks the admin panel for the session', function () {
    $admin = tfa_AdminWithSecret();

    $this->actingAs($admin)
        ->post('/auth/two-factor/verify', ['code' => tfa_CurrentOtp($admin)])
        ->assertRedirect('/admin');

    $this->get('/admin')->assertOk();
});

it('rejects a wrong OTP and keeps the admin panel blocked', function () {
    $admin = tfa_AdminWithSecret();

    $this->actingAs($admin)
        ->post('/auth/two-factor/verify', ['code' => '000000'])
        ->assertSessionHasErrors('code');

    $this->get('/admin')->assertRedirect('/auth/two-factor/verify');
});

it('does not gate non-admin roles behind 2FA', function () {
    $operator = User::where('role', 'operator_sekolah')->firstOrFail()->fresh();
    $operator->update(['password' => 'password']);

    $this->post('/login', ['identifier' => $operator->email, 'password' => 'password'])
        ->assertRedirect('/verifikasi');

    // /admin is still forbidden for operators — but by the role guard,
    // not a 2FA redirect.
    $this->get('/admin')->assertForbidden();
});
