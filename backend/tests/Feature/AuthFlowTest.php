<?php

use App\Models\OtpCode;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

it('looks up a known NISN and renders the confirmed-data screen', function () {
    $student = Student::query()->firstOrFail();

    $this->post('/auth/nisn', ['nisn' => $student->nisn])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/OtpSend')
            ->where('nisn', $student->nisn)
            ->where('student.nama', $student->nama));
});

it('rejects an unknown NISN', function () {
    $this->post('/auth/nisn', ['nisn' => '9999999999'])
        ->assertStatus(302)
        ->assertSessionHasErrors('nisn');
});

it('rejects a malformed NISN format', function () {
    $this->post('/auth/nisn', ['nisn' => 'abc'])
        ->assertStatus(302)
        ->assertSessionHasErrors('nisn');
});

it('issues an OTP row without storing the code in plaintext', function () {
    $student = Student::query()->firstOrFail();

    $this->post('/auth/otp/send', ['nisn' => $student->nisn])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/OtpVerify'));

    $otp = OtpCode::where('nisn', $student->nisn)->latest('id')->first();
    expect($otp)->not->toBeNull();
    expect($otp->code_hash)->not->toBe('000000');
    expect($otp->code_hash)->toMatch('/^\$2/'); // bcrypt hash
});

it('logs an audit entry for OTP send', function () {
    $student = Student::query()->firstOrFail();

    $this->post('/auth/otp/send', ['nisn' => $student->nisn]);

    $this->assertDatabaseHas('audit_logs', ['action' => 'auth.otp.sent']);
});

it('verifies a correct OTP, opens a session, and links the pendaftar', function () {
    $student = Student::query()->firstOrFail();

    $otp = OtpCode::create([
        'nisn' => $student->nisn,
        'code_hash' => Hash::make('123456'),
        'request_token' => 'tok-abc-123',
        'attempts' => 0,
        'expires_at' => now()->addMinutes(5),
    ]);

    $response = $this->post('/auth/otp/verify', [
        'nisn' => $student->nisn,
        'request_token' => 'tok-abc-123',
        'code' => '123456',
    ]);

    $response->assertRedirect(route('dashboard.pendaftar'));

    $this->assertAuthenticated();
    $user = auth()->user();
    expect($user->role)->toBe('pendaftar');
    expect($user->student_id)->toBe($student->id);

    $this->assertDatabaseHas('audit_logs', ['action' => 'auth.otp.verified']);
    $this->assertNotNull($otp->fresh()->verified_at);
});

it('rejects a wrong OTP and increments the attempt counter', function () {
    $student = Student::query()->firstOrFail();

    $otp = OtpCode::create([
        'nisn' => $student->nisn,
        'code_hash' => Hash::make('111111'),
        'request_token' => 'tok-wrong',
        'attempts' => 0,
        'expires_at' => now()->addMinutes(5),
    ]);

    $this->post('/auth/otp/verify', [
        'nisn' => $student->nisn,
        'request_token' => 'tok-wrong',
        'code' => '222222',
    ])->assertSessionHasErrors('code');

    expect($otp->fresh()->attempts)->toBe(1);
});

it('rejects an expired OTP', function () {
    $student = Student::query()->firstOrFail();

    OtpCode::create([
        'nisn' => $student->nisn,
        'code_hash' => Hash::make('123456'),
        'request_token' => 'tok-expired',
        'attempts' => 0,
        'expires_at' => now()->subMinute(),
    ]);

    $this->post('/auth/otp/verify', [
        'nisn' => $student->nisn,
        'request_token' => 'tok-expired',
        'code' => '123456',
    ])->assertSessionHasErrors('code');
});

it('blocks a pendaftar after 5 failed attempts', function () {
    $student = Student::query()->firstOrFail();

    $otp = OtpCode::create([
        'nisn' => $student->nisn,
        'code_hash' => Hash::make('123456'),
        'request_token' => 'tok-max',
        'attempts' => 5,
        'expires_at' => now()->addMinutes(5),
    ]);

    $this->post('/auth/otp/verify', [
        'nisn' => $student->nisn,
        'request_token' => 'tok-max',
        'code' => '123456',
    ])->assertSessionHasErrors('code');

    expect($otp->fresh()->verified_at)->toBeNull();
});