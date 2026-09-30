<?php

use App\Integration\DataIntegrationGateway;
use App\Integration\StudentRecord;
use App\Models\OtpCode;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/*
|--------------------------------------------------------------------------
| Rantai identitas NISN → NIK → data diri (anti-pemalsuan identitas)
|--------------------------------------------------------------------------
| Tiga lapis penguatan atas trust boundary identitas:
|  1. Saat akun pendaftar PERTAMA kali diklaim lewat OTP, identitas siswa
|     (nisn + nik + tanggal lahir) DIKUNCI sebagai sidik jari
|     (students.identity_hash, sha256). Setelah terkunci, sinkron data dari
|     gateway yang membawa NIK/TTL berbeda terdeteksi sebagai DRIFT dan
|     TIDAK menimpa data asli — memutus "NIK bisa diubah diam-diam lalu
|     mencemari semua integrasi hilir".
|  2. NISN bukan lagi kata sandi. Login NISN-as-password hanya berlaku
|     untuk akun berlabel `demo_login` (akun demo/uji). Akun siswa
|     operasional dibuat dengan password acak dan masuk lewat NISN → OTP.
|  3. Intake siswa oleh operator SMP menghasilkan password acak — tidak
|     pernah `Hash::make(nisn)`.
|--------------------------------------------------------------------------
*/

/** Siswa uji yang belum terpakai di seed. */
function identity_student(string $nisn = '7799000001', string $nik = '3271013105120001'): Student
{
    return Student::create([
        'nisn' => $nisn,
        'nik' => $nik,
        'nama' => 'Siswa Identitas',
        'tempat_lahir' => 'Bandung',
        'tanggal_lahir' => '2012-05-12',
        'jenis_kelamin' => 'L',
        'agama' => 'Islam',
        'source' => 'test',
    ]);
}

/** Terbitkan OTP untuk siswa (kode diketahui: 654321). */
function identity_issueOtp(string $nisn): OtpCode
{
    return OtpCode::create([
        'nisn' => $nisn,
        'code_hash' => Hash::make('654321'),
        'request_token' => 'identity-token-'.substr(bin2hex(random_bytes(8)), 0, 16),
        'attempts' => 0,
        'expires_at' => now()->addMinutes(5),
    ]);
}

/** Klaim akun via HTTP (lookup → OTP → verify) sampai identitas terkunci. */
function identity_claim(string $nisn): User
{
    test()->withServerVariables(['REMOTE_ADDR' => '10.9.3.'.mt_rand(1, 254)])
        ->post('/auth/nisn', ['nisn' => $nisn])->assertOk();

    $otp = identity_issueOtp($nisn);

    test()->withServerVariables(['REMOTE_ADDR' => '10.9.3.'.mt_rand(1, 254)])
        ->post('/auth/otp/verify', [
            'nisn' => $nisn,
            'request_token' => $otp->request_token,
            'code' => '654321',
        ])->assertRedirect('/dashboard');

    return User::whereHas('student', fn ($q) => $q->where('nisn', $nisn))->firstOrFail();
}

it('mengunci sidik jari identitas saat akun pendaftar pertamakali diklaim via OTP', function () {
    $student = identity_student();
    expect($student->identity_hash)->toBeNull();

    $user = identity_claim($student->nisn);

    $student->refresh();
    expect($student->identity_hash)->toMatch('/^[a-f0-9]{64}$/');
    expect($student->identity_bound_at)->not->toBeNull();
    expect($user->role)->toBe('pendaftar');
    expect($user->student_id)->toBe($student->id);

    $this->assertDatabaseHas('audit_logs', ['event' => 'identity.bound']);
});

it('tidak mengunci ulang identitas yang sudah terikat (binding idempoten)', function () {
    $student = identity_student();
    $first = identity_claim($student->nisn);

    // Klaim kedua (akun sama, firstOrCreate) tidak boleh membuat hash baru.
    $student->refresh();
    $boundHash = $student->identity_hash;

    $otp = identity_issueOtp($student->nisn);
    test()->withServerVariables(['REMOTE_ADDR' => '10.9.4.'.mt_rand(1, 254)])
        ->post('/auth/otp/verify', [
            'nisn' => $student->nisn,
            'request_token' => $otp->request_token,
            'code' => '654321',
        ])->assertRedirect('/dashboard');

    expect($student->fresh()->identity_hash)->toBe($boundHash);
    expect(Student::where('nisn', $student->nisn)->count())->toBe(1);
});

it('blokir drift: gateway yang mengembalikan NIK/TTL berbeda tidak bisa menimpa identitas terikat', function () {
    $student = identity_student();
    // Bind identitas langsung (tanpa HTTP) — fokus test ini adalah gerbang
    // lookup, bukan jalur klaim (jalur klaim diuji test terpisah).
    $flow = app(\App\Services\AuthFlow::class);
    $student->update([
        'identity_hash' => $flow->identityFingerprint($student->nisn, $student->nik, $student->tanggal_lahir),
        'identity_bound_at' => now(),
    ]);
    $before = $student->fresh();

    // Gateway "pemerintah" yang berubah (mis. data dicemari / rekaman salah):
    // NIK dan TTL berbeda dari yang dikunci saat klaim.
    $evilGateway = new class implements DataIntegrationGateway {
        public function lookupByNisn(string $nisn): StudentRecord
        {
            return new StudentRecord(
                nisn: $nisn,
                nik: '3374010101999999',
                nama: 'Identitas Berubah',
                tempatLahir: 'Jakarta',
                tanggalLahir: Carbon::parse('2010-01-01'),
                jenisKelamin: 'P',
                agama: null,
                sekolahAsal: 'SD Negeri Lain',
                tahunLulus: '2024',
                alamat: 'Jl. Baru',
                namaAyah: 'Ayah Lain',
                namaIbu: 'Ibu Lain',
                rt: '001',
                rw: '002',
            );
        }
    };
    $this->app->bind(DataIntegrationGateway::class, fn () => $evilGateway);

    $this->withServerVariables(['REMOTE_ADDR' => '10.9.5.'.mt_rand(1, 254)])
        ->post('/auth/nisn', ['nisn' => $student->nisn])->assertOk();

    // Data asli TIDAK berubah — sinkron identitas diblokir.
    $after = $student->fresh();
    expect($after->nik)->toBe($before->nik);
    expect($after->nama)->toBe($before->nama);
    expect($after->tanggal_lahir->format('Y-m-d'))->toBe($before->tanggal_lahir->format('Y-m-d'));
    expect($after->jenis_kelamin)->toBe($before->jenis_kelamin);
    expect($after->identity_hash)->toBe($before->identity_hash);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'identity.drift.detected',
    ]);
});

it('lookup berulang dengan data gateway yang identik tetap sinkron tanpa drift', function () {
    $student = identity_student();
    identity_claim($student->nisn);
    $before = $student->fresh();

    // Gateway default (MockAdapter) membaca data lokal yang sama → identik.
    $this->app->singleton(\App\Integration\DataIntegrationGateway::class, \App\Integration\Adapters\MockAdapter::class);
    $this->withServerVariables(['REMOTE_ADDR' => '10.9.6.'.mt_rand(1, 254)])
        ->post('/auth/nisn', ['nisn' => $student->nisn])->assertOk();

    $after = $student->fresh();
    expect($after->nik)->toBe($before->nik);
    expect($after->identity_hash)->toBe($before->identity_hash);
    $this->assertDatabaseMissing('audit_logs', ['event' => 'identity.drift.detected']);
    $this->assertDatabaseHas('audit_logs', ['event' => 'auth.nisn.lookup']);
});

it('siswa yang belum terikat (belum ada akun) boleh disinkron dari gateway', function () {
    $student = identity_student();
    expect($student->identity_hash)->toBeNull();

    $this->withServerVariables(['REMOTE_ADDR' => '10.9.7.'.mt_rand(1, 254)])
        ->post('/auth/nisn', ['nisn' => $student->nisn])->assertOk();

    // Sync lintas relasi tetap berjalan (Satu Data) — hash masih null karena
    // kunci identitas baru terbentuk saat klaim akun pertama.
    $after = $student->fresh();
    expect($after->identity_hash)->toBeNull();
    $this->assertDatabaseHas('audit_logs', ['event' => 'auth.nisn.lookup']);
});

it('menolak login NISN-as-password untuk akun pendaftar non-demo', function () {
    $student = identity_student();
    $user = User::factory()->create([
        'role' => 'pendaftar',
        'demo_login' => false,
        'password' => $student->nisn,
        'student_id' => $student->id,
    ]);
    expect(Hash::check($student->nisn, $user->password))->toBeTrue();

    // Tahu NISN saja TIDAK cukup untuk masuk — NISN bukan kredensial.
    $this->withServerVariables(['REMOTE_ADDR' => '10.9.9.'.mt_rand(1, 254)])
        ->post('/login', ['identifier' => $student->nisn, 'password' => $student->nisn])
        ->assertSessionHasErrors('identifier');
    $this->assertGuest();
});

it('membolehkan login NISN-as-password hanya untuk akun demo_login', function () {
    $student = identity_student();
    $user = User::factory()->create([
        'role' => 'pendaftar',
        'demo_login' => true,
        'password' => $student->nisn,
        'student_id' => $student->id,
    ]);

    $this->withServerVariables(['REMOTE_ADDR' => '10.9.10.'.mt_rand(1, 254)])
        ->post('/login', ['identifier' => $student->nisn, 'password' => $student->nisn])
        ->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($user);
});