<?php

use App\Models\AdmissionPath;
use App\Models\Complaint;
use App\Models\Document;
use App\Models\OtpCode;
use App\Models\Quota;
use App\Models\QuotaRequest;
use App\Models\Registration;
use App\Models\School;
use App\Models\SelectionResult;
use App\Models\Student;
use App\Models\User;
use App\Services\RegistrationFlow;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use PragmaRX\Google2FALaravel\Google2FA;

/*
|--------------------------------------------------------------------------
| End-to-end journeys — the full SPMB system driven over real HTTP.
|--------------------------------------------------------------------------
| Every test here walks a complete user story through routes → controllers
| → services → database (no fakes), mirroring what a real operator or
| candidate would do in the browser.
|
| Helper naming uses the e2e_* prefix so it never collides with helpers
| declared in the other Feature test files (Pest loads them globally).
*/

/**
 * Guarantee a quota row with free seats for (school, path) and return the pair.
 *
 * @return array{0: School, 1: AdmissionPath}
 */
function e2e_quotaReady(): array
{
    $school = School::query()->orderBy('id')->firstOrFail();
    $path = AdmissionPath::query()->orderBy('id')->firstOrFail();

    Quota::updateOrCreate(
        ['school_id' => $school->id, 'admission_path_id' => $path->id],
        ['kuota' => 50, 'terisi' => 0],
    );

    return [$school, $path];
}

/**
 * Drive a registration to 'submitted' via the real RegistrationFlow service
 * (same code path the wizard uses), uploading exactly the mandatory documents
 * for the chosen path.
 */
function e2e_submittedRegistration(School $school, AdmissionPath $path): Registration
{
    $quota = Quota::where('school_id', $school->id)
        ->where('admission_path_id', $path->id)
        ->firstOrFail();
    $quota->update(['terisi' => 0]);

    $user = User::factory()->create([
        'student_id' => Student::query()->firstOrFail()->id,
        'role' => 'pendaftar',
    ]);

    $flow = app(RegistrationFlow::class);
    $registration = $flow->draftOrCreate($user);
    $flow->pickPath($registration, $path->code);
    $flow->setChoices($registration, [$school->id]);

    $required = match ($path->id) {
        1 => ['KK', 'Ijazah'],          // zonasi
        2 => ['KK', 'KIP', 'SKTM'],     // prestasi (seed order: id 2)
        3 => ['KK', 'Sertifikat_Prestasi'], // afirmasi (seed order: id 3)
        4 => ['KK', 'Surat_Mutasi'],    // perpindahan (seed order: id 4)
        default => ['KK'],
    };

    foreach ($required as $type) {
        Document::create([
            'registration_id' => $registration->id,
            'type' => $type,
            'path' => "documents/dummy/{$type}.pdf",
            'status' => 'menunggu',
        ]);
    }

    $flow->submit($registration);

    return $registration->fresh();
}

/** Admin yang sudah enroll 2FA (untuk journey admin). */
function e2e_tfaAdmin(): User
{
    $admin = User::where('email', 'admin.provinsi@spmb.jabar')->firstOrFail();
    $admin->update([
        'password' => 'password',
        'google2fa_secret' => app(Google2FA::class)->generateSecretKey(),
    ]);

    return $admin->fresh();
}

/** Kode OTP Google Authenticator aktif untuk user yang sudah enroll. */
function e2e_currentOtp(User $user): string
{
    return app(Google2FA::class)->getCurrentOtp($user->google2fa_secret);
}

it('menjalankan journey lengkap calon siswa: publik → NISN/OTP → wizard → submit → cek hasil', function () {
    [$school, $path] = e2e_quotaReady();

    // ── 1. Permukaan publik ────────────────────────────────────────────
    $this->get('/')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Landing'));
    $this->get('/public/directory')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Public/Directory'));
    $this->get('/public/downloads')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Public/Downloads'));
    $this->get('/public/announcement')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Public/Announcement')
            ->where('result', null));

    // ── 2. NISN → OTP → sesi pendaftar ────────────────────────────────
    $student = Student::query()->firstOrFail();

    $this->post('/auth/nisn', ['nisn' => $student->nisn])->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/OtpSend')
            ->where('nisn', $student->nisn));

    $this->post('/auth/otp/send', ['nisn' => $student->nisn])->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/OtpVerify'));

    $this->assertDatabaseHas('audit_logs', ['event' => 'auth.otp.sent']);

    // Mock SMS = log channel; di test kami baca ulang baris OTP dan substitusi
    // hash-nya dengan kode yang diketahui (isi SMS tidak pernah plaintext di DB).
    $otp = OtpCode::where('nisn', $student->nisn)->whereNull('verified_at')->latest('id')->firstOrFail();
    $otp->update(['code_hash' => Hash::make('654321')]);

    $this->post('/auth/otp/verify', [
        'nisn' => $student->nisn,
        'request_token' => $otp->request_token,
        'code' => '654321',
    ])->assertRedirect(route('dashboard.pendaftar'));

    $this->assertAuthenticated();
    $user = auth()->user();
    expect($user->role)->toBe('pendaftar');
    expect($user->student_id)->toBe($student->id);
    $this->assertDatabaseHas('audit_logs', ['event' => 'auth.otp.verified']);

    // ── 3. Dashboard pendaftar ─────────────────────────────────────────
    $this->get('/dashboard')->assertOk();

    // ── 4. Wizard — draft dibuat otomatis ──────────────────────────────
    $registrationPage = $this->get('/pendaftaran')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Registration/Show')
            ->where('step', 1)
            ->where('registration.status', 'draft'));

    // Catatan: instance user dari guard auth() meng-cache relasi antar request,
    // jadi baca semua data registrasi langsung dari props/respon & query DB.
    $noPendaftaran = $registrationPage->viewData('page')['props']['registration']['no_pendaftaran'];
    expect($noPendaftaran)->not->toBeNull();
    expect($noPendaftaran)->toMatch('/^SPMB\d+/');

    // Submit sebelum jalur dipilih harus ditolak (guard langkah 1)
    $this->post('/pendaftaran/submit')->assertSessionHasErrors('submit');

    // ── 5. Pilih jalur → pilih sekolah → unggah dokumen ────────────────
    $this->post('/pendaftaran/path', ['path_code' => $path->code])->assertRedirect();
    $this->post('/pendaftaran/choices', ['school_ids' => [$school->id]])->assertRedirect();

    foreach (['KK', 'Ijazah'] as $type) {
        $this->post('/pendaftaran/documents', [
            'type' => $type,
            'file' => UploadedFile::fake()->create(strtolower($type).'.pdf', 120, 'application/pdf'),
        ])->assertRedirect();
    }

    // Dokumen tambahan (tidak wajib untuk jalur ini) tetap diterima
    $this->post('/pendaftaran/documents', [
        'type' => 'Surat_Sakit',
        'file' => UploadedFile::fake()->create('sakit.pdf', 120, 'application/pdf'),
    ])->assertRedirect();

    // ── 6. Submit → terverifikasi awal + kuota terisi ──────────────────
    $this->post('/pendaftaran/submit')
        ->assertRedirect(route('registration.complete', $noPendaftaran));

    $registration = Registration::where('no_pendaftaran', $noPendaftaran)->firstOrFail();
    expect($registration->status)->toBe('terverifikasi_awal');
    $this->assertDatabaseHas('audit_logs', ['event' => 'registration.submitted']);

    $quota = Quota::where('school_id', $school->id)->where('admission_path_id', $path->id)->first();
    expect($quota->terisi)->toBe(1);

    // Instance user di guard di-cache antar request dalam satu test (artifact
    // environment test); bersihkan relasi agar lazy-load berjalan seperti
    // request produksi yang fresh.
    auth()->user()->unsetRelation('registration');

    $this->get('/pendaftaran/complete/'.$noPendaftaran)->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Registration/Complete'));

    // ── 7. Cek hasil sebelum seleksi → hasil belum ada ─────────────────
    $this->get('/public/announcement?no_pendaftaran='.$noPendaftaran)->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Public/Announcement')
            ->where('result', null)
            ->whereNot('error', null));
});

it('menjalankan journey verifikasi operator: antrean → valid → verified', function () {
    [$school, $path] = e2e_quotaReady();
    $registration = e2e_submittedRegistration($school, $path);
    expect($registration->status)->toBe('terverifikasi_awal');

    $operator = User::where('email', 'operator.smpn1@spmb.jabar')->firstOrFail();
    $operator->update(['password' => 'password']);

    $this->post('/login', ['identifier' => $operator->email, 'password' => 'password'])
        ->assertRedirect('/verifikasi');
    $this->assertAuthenticatedAs($operator);

    // Antrean verifikasi berisi pendaftar yang memilih sekolah operator
    $this->get('/verifikasi')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Verification/Index')
            ->where('registrations.0.id', $registration->id));

    // Review valid — tulis terjadi di dalam VerificationFlow (transactional)
    $this->post("/verifikasi/{$registration->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => 1,
        'is_ijazah_verified' => 1,
        'is_alamat_verified' => 1,
        'catatan' => 'Dokumen lengkap dan sesuai.',
    ])->assertRedirect();

    $fresh = $registration->fresh();
    expect($fresh->status)->toBe('verified');
    expect($fresh->only(['is_kk_verified', 'is_ijazah_verified', 'is_alamat_verified']))
        ->toBe(['is_kk_verified' => true, 'is_ijazah_verified' => true, 'is_alamat_verified' => true]);
    $this->assertDatabaseHas('verifications', ['registration_id' => $registration->id, 'status' => 'valid']);
    $this->assertDatabaseHas('audit_logs', ['event' => 'registration.verified']);

    // Antrean sudah kosong untuk pendaftar ini
    $this->get('/verifikasi')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('registrations', 0));
});

it('menjalankan journey admin: 2FA → kuota → seleksi → pengumuman publik', function () {
    $school = School::query()->orderBy('id')->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    Quota::updateOrCreate(
        ['school_id' => $school->id, 'admission_path_id' => $path->id],
        ['kuota' => 10, 'terisi' => 0],
    );

    $registration = e2e_submittedRegistration($school, $path);
    expect($registration->status)->toBe('terverifikasi_awal');

    // Verifikasi sampai eligible seleksi (status 'verified')
    $operator = User::where('email', 'operator.smpn1@spmb.jabar')->firstOrFail();
    $operator->update(['password' => 'password']);
    $this->post('/login', ['identifier' => $operator->email, 'password' => 'password']);
    $this->post("/verifikasi/{$registration->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => 1,
        'is_ijazah_verified' => 1,
        'is_alamat_verified' => 1,
    ])->assertRedirect();
    expect($registration->fresh()->status)->toBe('verified');

    // Operator mengajukan penambahan kuota
    $this->post('/sekolah/quota-request', [
        'admission_path_id' => $path->id,
        'requested_kuota' => 30,
    ])->assertRedirect();
    $this->assertDatabaseHas('quota_requests', ['school_id' => $school->id, 'status' => 'pending']);

    // ── Ganti aktor: logout operator → login admin provinsi dengan 2FA ──
    $this->post('/logout')->assertRedirect(route('landing'));

    $admin = e2e_tfaAdmin();

    $this->post('/login', ['identifier' => $admin->email, 'password' => 'password'])
        ->assertRedirect('/auth/two-factor/verify');

    // Panel masih terkunci sampai OTP diverifikasi
    $this->get('/admin')->assertRedirect('/auth/two-factor/verify');

    $this->post('/auth/two-factor/verify', ['code' => e2e_currentOtp($admin)])
        ->assertRedirect('/admin');

    $this->get('/admin')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));

    // ── Distribusi global lalu setujui pengajuan kuota ─────────────────
    expect(AdmissionPath::count())->toBe(4);

    $this->post('/admin/periode/distribution', [
        'distribution' => AdmissionPath::orderBy('id')->get()
            ->map(fn (AdmissionPath $p, int $i) => [
                'path_id' => $p->id,
                'percentage' => $i === 0 ? 40 : 20,
            ])
            ->values()
            ->all(),
    ])->assertRedirect();

    $period = \App\Models\AdmissionPeriod::where('is_active', true)->firstOrFail();
    $this->assertDatabaseHas('global_quota_distribution', [
        'admission_period_id' => $period->id,
        'percentage' => 40,
    ]);

    $quotaRequest = QuotaRequest::where('school_id', $school->id)->latest('id')->firstOrFail();
    $this->post('/admin/kuota/process', [
        'quota_request_id' => $quotaRequest->id,
        'status' => 'approved',
        'notes' => 'Disetujui sesuai proyeksi.',
    ])->assertRedirect();

    expect($quotaRequest->fresh()->status)->toBe('approved');
    $this->assertDatabaseHas('quotas', [
        'school_id' => $school->id,
        'admission_path_id' => $path->id,
        'kuota' => 6, // 30 × 20%
    ]);

    // ── Seleksi: dry-run tanpa persist → publish → hasil tersimpan ─────
    $this->post('/admin/seleksi/dry-run')->assertOk();
    $this->assertDatabaseCount('selection_results', 0);

    $this->post('/admin/seleksi/publish')->assertRedirect();
    $this->assertDatabaseHas('selection_results', [
        'registration_id' => $registration->id,
        'school_id' => $school->id,
        'status' => 'selected',
    ]);
    $this->assertDatabaseHas('audit_logs', ['event' => 'selection.published']);

    // ── Pengumuman publik: hasil tersedia, nama & identitas dimasking ──
    $this->get('/public/announcement?no_pendaftaran='.$registration->no_pendaftaran)->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Public/Announcement')
            ->where('result.status', 'selected')
            ->where('result.school', $school->name)
            ->whereNot('result.name', $registration->student->nama)
            ->whereNot('result.identifier', $registration->no_pendaftaran));
});

it('menjalankan journey pengaduan: buat oleh pendaftar → tanggapan admin → selesai', function () {
    $user = User::factory()->create([
        'student_id' => Student::query()->firstOrFail()->id,
        'role' => 'pendaftar',
    ]);

    $this->actingAs($user)->get('/pengaduan')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Complaint/Index'));

    $this->actingAs($user)->post('/pengaduan', [
        'category' => 'dokumen',
        'subject' => 'Tidak bisa mengunggah berkas KK',
        'message' => 'Upload selalu gagal setelah memilih file KK berformat PDF.',
    ])->assertRedirect();

    $complaint = Complaint::query()->firstOrFail();
    expect($complaint->user_id)->toBe($user->id);
    expect($complaint->status)->toBe('dibuat');
    expect($complaint->category)->toBe('dokumen');
    $this->assertDatabaseHas('audit_logs', ['event' => 'complaint.created']);

    // Ganti aktor: pendaftar → admin (login via POST butuh sesi kosong)
    $admin = User::where('email', 'admin.provinsi@spmb.jabar')->firstOrFail();
    $admin->update(['password' => 'password']);
    $this->actingAs($admin)->get('/admin')->assertOk();

    $this->actingAs($admin)->post("/admin/pengaduan/{$complaint->id}/respond", [
        'status' => 'selesai',
        'response' => 'Berkas KK Anda sudah berhasil diunggah dari dashboard.',
        'priority' => 'high',
        'internal_notes' => 'Diperbaiki di rilis 1.2 (max 2MB).',
    ])->assertRedirect();

    $fresh = $complaint->fresh();
    expect($fresh->status)->toBe('selesai');
    expect($fresh->admin_response)->toBe('Berkas KK Anda sudah berhasil diunggah dari dashboard.');
    expect($fresh->resolved_at)->not->toBeNull();
    $this->assertDatabaseHas('audit_logs', ['event' => 'complaint.responded']);
});

it('menjalankan intake siswa oleh operator SMP sampai akun pendaftar bisa login', function () {
    $school = School::query()->orderBy('id')->firstOrFail();
    $smpOperator = User::factory()->create([
        'role' => 'operator_smp',
        'school_id' => $school->id,
        'password' => 'password',
    ]);

    $this->actingAs($smpOperator)->get('/smp')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Smp/Dashboard'));

    $nisn = '8880000001';
    $nik = '3271011506120007';

    $this->actingAs($smpOperator)->post('/smp/students', [
        'nisn' => $nisn,
        'nik' => $nik,
        'nama' => 'Gita Ayu Lestari',
        'email' => 'gita.lulusan@contoh.id',
        'jenis_kelamin' => 'P',
        'tanggal_lahir' => '2012-06-01',
        'alamat' => 'Jl. Percobaan No. 1, Bandung',
    ])->assertRedirect();

    $this->assertDatabaseHas('students', ['nisn' => $nisn, 'nik' => $nik, 'school_id' => $school->id]);
    $student = Student::where('nisn', $nisn)->firstOrFail();
    expect($student->nama)->toBe('Gita Ayu Lestari');
    $this->assertDatabaseHas('addresses', ['student_id' => $student->id, 'alamat' => 'Jl. Percobaan No. 1, Bandung']);

    // NISN duplikat → tolak
    $this->actingAs($smpOperator)->post('/smp/students', [
        'nisn' => $nisn,
        'nik' => '3271011510110002',
        'nama' => 'Orang Lain',
        'email' => 'orang.lain@contoh.id',
        'jenis_kelamin' => 'L',
        'tanggal_lahir' => '2012-01-01',
        'alamat' => 'Jl. Lain No. 2',
    ])->assertSessionHasErrors('nisn');

    // Akun pendaftar dibuat sekaligus tertaut ke data siswa
    $createdUser = User::where('email', 'gita.lulusan@contoh.id')->firstOrFail();
    expect($createdUser->role)->toBe('pendaftar');
    expect($createdUser->student_id)->toBe($student->id);
    expect(Hash::check($nisn, $createdUser->password))->toBeTrue();

    // Siswa lulusan baru langsung bisa login dengan NISN sebagai password.
    // (Logout operator SMP dulu — sesi test masih memegang operator.)
    $this->post('/logout');
    $this->post('/login', ['identifier' => $nisn, 'password' => $nisn])
        ->assertRedirect('/dashboard');
    $this->assertAuthenticated();

    // ... dan bisa membuka wizard pendaftaran
    $this->get('/pendaftaran')->assertOk();
});

it('menegakkan matriks peran pada seluruh area sistem', function () {
    // Guest — area lindung dialihkan ke login
    $this->get('/admin')->assertRedirect('/login');
    $this->get('/verifikasi')->assertRedirect('/login');
    $this->get('/pendaftaran')->assertRedirect('/login');
    $this->get('/sekolah')->assertRedirect('/login');

    // Pendaftar (harus terhubung ke data siswa — kontrak wizard registrasi)
    $pendaftar = User::factory()->create([
        'role' => 'pendaftar',
        'student_id' => Student::query()->firstOrFail()->id,
    ]);
    $this->actingAs($pendaftar)->get('/pendaftaran')->assertOk();
    $this->actingAs($pendaftar)->get('/verifikasi')->assertForbidden();
    $this->actingAs($pendaftar)->get('/admin')->assertForbidden();
    $this->actingAs($pendaftar)->get('/sekolah')->assertForbidden();

    // Operator sekolah
    $school = School::query()->orderBy('id')->firstOrFail();
    $operator = User::factory()->create(['role' => 'operator_sekolah', 'school_id' => $school->id]);
    $this->actingAs($operator)->get('/verifikasi')->assertOk();
    $this->actingAs($operator)->get('/sekolah')->assertOk();
    $this->actingAs($operator)->get('/pendaftaran')->assertForbidden();
    $this->actingAs($operator)->get('/admin')->assertForbidden();

    // Verifikator (bisa verifikasi, bukan admin)
    $verifikator = User::factory()->create(['role' => 'verifikator']);
    $this->actingAs($verifikator)->get('/verifikasi')->assertOk();
    $this->actingAs($verifikator)->get('/admin')->assertForbidden();

    // Operator SMP — hanya area SMP
    $smpOperator = User::factory()->create(['role' => 'operator_smp', 'school_id' => $school->id]);
    $this->actingAs($smpOperator)->get('/smp')->assertOk();
    $this->actingAs($smpOperator)->get('/admin')->assertForbidden();
    $this->actingAs($smpOperator)->get('/verifikasi')->assertForbidden();

    // Admin kab/kota (tanpa 2FA terdaftar) masuk panel; seleksi provinsi ditolak
    $adminKab = User::factory()->create(['role' => 'admin_kabkota']);
    $this->actingAs($adminKab)->get('/admin')->assertOk();
    $this->actingAs($adminKab)->post('/admin/seleksi/publish')->assertForbidden();
    $this->actingAs($adminKab)->get('/smp')->assertForbidden();
});