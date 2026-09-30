<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Support\Audit;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Halaman Monitoring Keamanan
|--------------------------------------------------------------------------
| Deterrence hanya berguna kalau ada yang membacanya. Test ini mengunci
| kontrak yang membuat monitoring benar-benar bisa ditindaklanjuti:
|
|   1. Hanya superadmin & admin provinsi yang boleh melihat jejak audit.
|   2. Anomali kritis (dokumen dimodifikasi / drift identitas) terhitung
|      terpisah dari percobaan console yang sifatnya hanya curiosity.
|   3. Percobaan console dipecah per trigger, bukan hanya angka total.
|   4. Event di luar katalog tidak bisa difilter lewat query string.
|   5. Membuka halaman itu sendiri tercatat (siapa yang mengintip log).
|
*/

beforeEach(function () {
    $this->superadmin = User::where('role', 'superadmin')->firstOrFail()->fresh();
    $this->superadmin->update(['password' => 'password']);

    $this->adminProvinsi = User::where('role', 'admin_provinsi')->firstOrFail()->fresh();
    $this->adminProvinsi->update(['password' => 'password']);

    $this->adminKabkota = User::where('role', 'admin_kabkota')->firstOrFail()->fresh();
    $this->adminKabkota->update(['password' => 'password']);
});

function logEvent(string $event, array $details = [], ?User $user = null): AuditLog
{
    // bypass Audit::log() agar user_id bisa ditentukan eksplisit tanpa login.
    return AuditLog::create([
        'user_id' => $user?->id,
        'event' => $event,
        'new_values' => $details,
        'ip_address' => '10.9.1.5',
        'user_agent' => 'Mozilla/5.0 (Test)',
        'request_path' => 'http://localhost/monitoring',
    ]);
}

it('merender monitoring untuk superadmin dan admin provinsi', function () {
    $this->actingAs($this->superadmin)
        ->get('/monitoring')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Security/Monitoring')
            ->has('kpi.critical')
            ->has('kpi.console_attempts_24h')
            ->has('trend')
            ->has('actors')
            ->has('console_reasons')
            ->has('integrity.tracked')
            ->has('integrity.bound_identities')
            ->has('events.data')
            ->has('meta.catalogue')
        );

    $this->actingAs($this->adminProvinsi)->get('/monitoring')->assertOk();
});

it('menolak peran yang tidak memegang keputusan operasional', function () {
    foreach (['admin_kabkota' => $this->adminKabkota] as $role => $user) {
        $this->actingAs($user)->get('/monitoring')->assertForbidden();
    }
});

it('menolak tamu yang belum login', function () {
    $this->get('/monitoring')->assertRedirect('/login');
});

it('memisahkan anomali kritis dari percobaan console', function () {
    logEvent('document.tampered', ['document_id' => 1]);
    logEvent('identity.drift.detected', ['reason' => 'nik berbeda']);
    logEvent('security.console.attempt', ['reason' => 'shortcut:f12']);
    logEvent('security.console.attempt', ['reason' => 'context-menu']);
    logEvent('auth.otp.failed');

    $props = $this->actingAs($this->superadmin)
        ->get('/monitoring')
        ->assertOk()
        ->viewData('page');

    $props = $props['props'];

    // Dua event kritis (tampered + drift), bukan tiga — console bukan pemalsuan data.
    expect($props['kpi']['critical'])->toBe(2);
    expect($props['kpi']['console_attempts_total'])->toBe(2);
    expect($props['kpi']['otp_failed_24h'])->toBe(1);
    expect($props['kpi']['documents_tampered'])->toBe(1);
    expect($props['kpi']['identity_drift'])->toBe(1);
});

it('memecah percobaan console per trigger beserta jumlah akunnya', function () {
    logEvent('security.console.attempt', ['reason' => 'shortcut:f12'], $this->superadmin);
    logEvent('security.console.attempt', ['reason' => 'shortcut:f12'], $this->superadmin);
    logEvent('security.console.attempt', ['reason' => 'shortcut:f12'], $this->adminProvinsi);
    logEvent('security.console.attempt', ['reason' => 'devtools:open'], $this->superadmin);

    $props = $this->actingAs($this->superadmin)
        ->get('/monitoring')
        ->assertOk()
        ->viewData('page')['props'];

    $byReason = collect($props['console_reasons'])->keyBy('reason');

    // Tiga F12 dari dua akun berbeda — ini yang tidak terlihat dari angka total.
    expect($byReason['shortcut:f12']['count'])->toBe(3);
    expect($byReason['shortcut:f12']['users'])->toBe(2);
    expect($byReason['devtools:open']['count'])->toBe(1);
    expect($byReason)->toHaveCount(2);
});

it('mengelompokkan pelaku berdasarkan akun dengan IP terkait', function () {
    logEvent('document.tampered', [], $this->adminKabkota);
    logEvent('security.console.attempt', [], $this->adminKabkota);
    logEvent('security.console.attempt', [], $this->superadmin);

    $props = $this->actingAs($this->superadmin)
        ->get('/monitoring')
        ->assertOk()
        ->viewData('page')['props'];

    $top = collect($props['actors'])->first();

    expect($top['user_id'])->toBe($this->adminKabkota->id);
    expect($top['name'])->toBe($this->adminKabkota->name);
    expect($top['critical'])->toBe(1);
    expect($top['ips'])->toContain('10.9.1.5');
});

it('menyaring daftar event berdasarkan tingkat dan jenis', function () {
    logEvent('document.tampered', ['document_id' => 7]);
    logEvent('superadmin.twofa.reset', ['target_email' => 'x@y.z']);
    logEvent('identity.drift.detected');

    $kritis = $this->actingAs($this->superadmin)
        ->get('/monitoring?severity=critical')
        ->assertOk()
        ->viewData('page')['props'];

    expect(collect($kritis['events']['data'])->pluck('event')->unique()->sort()->values()->all())
        ->toBe(['document.tampered', 'identity.drift.detected']);

    $satu = $this->actingAs($this->superadmin)
        ->get('/monitoring?event=superadmin.twofa.reset')
        ->assertOk()
        ->viewData('page')['props'];

    expect(collect($satu['events']['data'])->pluck('event')->unique()->all())
        ->toBe(['superadmin.twofa.reset']);
});

it('menolak filter event yang tidak ada di katalog', function () {
    // Tanpa validasi katalog, ?event=ngawur menghasilkan tabel kosong yang
    // bisa disalahartikan sebagai "aman".
    $this->actingAs($this->superadmin)
        ->get('/monitoring?event=event.palsu')
        ->assertSessionHasErrors('event');

    $this->actingAs($this->superadmin)
        ->get('/monitoring?severity=ngawur')
        ->assertSessionHasErrors('severity');
});

it('mencatat akses ke halaman monitoring', function () {
    AuditLog::where('event', 'security.monitoring.viewed')->delete();

    $this->actingAs($this->superadmin)
        ->get('/monitoring?days=7')
        ->assertOk();

    $access = AuditLog::where('event', 'security.monitoring.viewed')
        ->where('user_id', $this->superadmin->id)
        ->latest('id')
        ->first();

    expect($access)->not->toBeNull();
    expect($access->new_values['filters'])->toMatchArray(['days' => 7]);
});

it('tidak pernah menampilkan halaman kosong saat tabel audit kosong', function () {
    // Nol event adalah kondisi normal di calves deployment — UI harus tetap
    // punya angka, bukan crash atau blank.
    AuditLog::query()->delete();

    $this->actingAs($this->superadmin)
        ->get('/monitoring')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Security/Monitoring')
            ->where('kpi.critical', 0)
            ->where('console_reasons', [])
            ->has('trend', 14)
            ->where('actors', [])
        );
});
