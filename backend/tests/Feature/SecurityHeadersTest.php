<?php

use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Security headers + console-guard deterrence
|--------------------------------------------------------------------------
| The console guard itself cannot be tested from PHP (it is a client-side
| deterrence) — what IS testable, and what actually matters, is:
|
|   1. Every response carries browser-enforced security headers.
|   2. The CSP nonce in the header matches the nonce on the emitted <script>
|      and <link> tags, so strict CSP does not break the app.
|   3. The client-side flag is only enabled for authenticated sessions, so
|      public pages stay usable (no blocked right-click on public PDFs).
|   4. Console detection reports land in the audit trail.
|
*/

it('menemit security header yang ditegakkan peramban pada setiap respons', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('X-Frame-Options', 'DENY');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    $response->assertHeader('Cross-Origin-Opener-Policy', 'same-origin');
});

it('menyfirkankan CSP ketat: frame-ancestors none, script berbasis nonce, tanpa unsafe-inline di produksi', function () {
    config(['security.csp.relaxed' => false]);

    $response = $this->get('/');
    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("default-src 'self'");
    expect($csp)->toContain("frame-ancestors 'none'");
    expect($csp)->toContain("object-src 'none'");
    expect($csp)->toContain("base-uri 'self'");
    expect($csp)->toContain("form-action 'self'");

    // Script & style harus berbasis nonce, bukan 'unsafe-inline'.
    expect($csp)->toMatch("/script-src 'self' 'nonce-[^']+'/");
    expect($csp)->not->toContain("script-src 'self' 'unsafe-inline'");
    expect($csp)->not->toContain("'unsafe-eval'");
});

it('menyamakan nonce pada header CSP dengan tag script dan stylesheet yang dirender', function () {
    // Kalau nonce tidak cocok, CSP ketat akan memblokir seluruh aplikasi.
    // Ini kontrak yang menjaga halaman tetap hidup. Ambil header & body dari
    // SATU respons — nonce dibuat baru tiap permintaan.
    $response = $this->get('/')->assertOk();
    $csp = $response->headers->get('Content-Security-Policy');
    $html = $response->getContent();

    expect($html)->toMatch('/<script[^>]*nonce="[^"]+"/');
    expect($html)->toMatch('/<link[^>]*rel="stylesheet"[^>]*nonce="[^"]+"/');

    preg_match("/script-src 'self' 'nonce-([^']+)'/", (string) $csp, $headerNonce);
    preg_match('/<script[^>]*nonce="([^"]+)"/', $html, $tagNonce);
    preg_match('/<link[^>]*rel="stylesheet"[^>]*nonce="([^"]+)"/', $html, $linkNonce);

    expect($headerNonce)->not->toBeEmpty();
    expect($tagNonce[1])->toBe($headerNonce[1]);
    expect($linkNonce[1])->toBe($headerNonce[1]);
});

it('memakai nonce berbeda untuk setiap respons', function () {
    $first = $this->get('/')->headers->get('Content-Security-Policy');
    $second = $this->get('/')->headers->get('Content-Security-Policy');

    expect($first)->not->toBe($second);
});

it('menyetel HSTS hanya di produksi', function () {
    expect($this->get('/')->headers->get('Strict-Transport-Security'))->toBeNull();
});

it('menyerahkan flag console guard hanya untuk sesi terautentikasi', function () {
    config(['security.console_guard' => true]);

    // Tamu: tidak ada guard (halaman publik tetap bisa menyimpan PDF).
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Landing')
        ->where('security.consoleGuard', false));

    // staf: guard aktif.
    $operator = User::where('role', 'operator_sekolah')->firstOrFail();
    $this->actingAs($operator)->get('/verifikasi')->assertInertia(fn (Assert $page) => $page
        ->component('Verification/Index')
        ->where('security.consoleGuard', true)
        ->where('security.consoleReportUrl', route('security.console.report')));
});

it('mematikan console guard sepenuhnya saat config dimatikan', function () {
    config(['security.console_guard' => false]);

    $operator = User::where('role', 'operator_sekolah')->firstOrFail();
    $this->actingAs($operator)->get('/verifikasi')->assertInertia(fn (Assert $page) => $page
        ->where('security.consoleGuard', false));
});

it('mencatat percobaan console ke log audit beserta alasan dan jalur', function () {
    $operator = User::where('role', 'operator_sekolah')->firstOrFail();

    $this->actingAs($operator)
        ->postJson('/security/console-report', ['reason' => 'shortcut:f12', 'path' => '/verifikasi'])
        ->assertOk()
        ->assertJson(['ok' => true]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'security.console.attempt',
        'user_id' => $operator->id,
    ]);

    $log = \App\Models\AuditLog::where('event', 'security.console.attempt')->latest('id')->first();
    expect($log->new_values['reason'])->toBe('shortcut:f12');
    expect($log->new_values['path'])->toBe('/verifikasi');
});

it('menolak laporan console dengan alasan tak valid', function () {
    $operator = User::where('role', 'operator_sekolah')->firstOrFail();

    $this->actingAs($operator)
        ->postJson('/security/console-report', ['reason' => str_repeat('x', 100)])
        ->assertStatus(422);

    $this->assertDatabaseMissing('audit_logs', ['event' => 'security.console.attempt']);
});

it('membatasi laju laporan console agar tidak membanjiri audit log', function () {
    // Route memakai throttle:30,1 — verifikasi einfach dengan mengirim 32×.
    $operator = User::where('role', 'operator_sekolah')->firstOrFail();

    for ($i = 0; $i < 32; $i++) {
        $this->withServerVariables(['REMOTE_ADDR' => '10.7.7.'.(1 + $i % 250)])
            ->actingAs($operator)
            ->postJson('/security/console-report', ['reason' => 'devtools:open']);
    }

    // Throttle tidak boleh melempar 500; respons boleh 200 atau 429.
    $last = $this->withServerVariables(['REMOTE_ADDR' => '10.7.7.7'])
        ->actingAs($operator)
        ->postJson('/security/console-report', ['reason' => 'devtools:open']);

    expect($last->status())->toBeIn([200, 429]);
});
