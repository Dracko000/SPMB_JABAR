<?php

use App\Models\AdmissionPath;
use App\Models\Document;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\RegistrationFlow;
use Inertia\Testing\AssertableInertia as Assert;

function submittedRegistration(School $school, AdmissionPath $path): Registration
{
    $quota = Quota::where('school_id', $school->id)->where('admission_path_id', $path->id)->firstOrFail();
    $quota->update(['terisi' => 0]);

    $user = User::factory()->create(['student_id' => Student::query()->firstOrFail()->id, 'role' => 'pendaftar']);
    $flow = app(RegistrationFlow::class);
    $flow->pickPath($flow->draftOrCreate($user), $path->code);
    $reg = $flow->draftOrCreate($user);
    $flow->setChoices($reg, [$school->id]);

    // The refactored submit contract validates mandatory documents per path
    // before reserving quota, so pre-upload what the path requires.
    $required = match ($path->code) {
        'afirmasi' => ['KK', 'KIP', 'SKTM'],
        'prestasi' => ['KK', 'Sertifikat_Prestasi'],
        'mutasi' => ['KK', 'Surat_Mutasi'],
        default => ['KK', 'Ijazah'], // zonasi
    };
    foreach ($required as $type) {
        Document::create([
            'registration_id' => $reg->id,
            'type' => $type,
            'path' => "documents/dummy/{$type}.pdf",
            'status' => 'menunggu',
        ]);
    }

    $flow->submit($reg);

    return $reg->fresh();
}

it('lists only registrations submitted to the operator school', function () {
    $school1 = School::query()->orderBy('id')->first();
    $school2 = School::query()->orderByDesc('id')->first();
    $path = AdmissionPath::query()->firstOrFail();

    $inScope = submittedRegistration($school1, $path);
    submittedRegistration($school2, $path);

    $operator = User::factory()->create(['role' => 'operator_sekolah', 'school_id' => $school1->id]);

    $this->actingAs($operator)->get('/verifikasi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Verification/Index')
            ->where('registrations.0.id', $inScope->id)
            ->has('registrations', 1));
});

it('lets the operator verify a scoped registration', function () {
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::query()->firstOrFail();

    $reg = submittedRegistration($school, $path);
    $operator = User::factory()->create(['role' => 'operator_sekolah', 'school_id' => $school->id]);

    $this->actingAs($operator)->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => 1,
        'is_ijazah_verified' => 1,
        'is_alamat_verified' => 1,
        'catatan' => 'dokumen lengkap',
    ])->assertRedirect();

    expect($reg->fresh()->status)->toBe('verified');
    expect($reg->fresh()->only(['is_kk_verified', 'is_ijazah_verified', 'is_alamat_verified']))
        ->toBe(['is_kk_verified' => true, 'is_ijazah_verified' => true, 'is_alamat_verified' => true]);
    $this->assertDatabaseHas('verifications', ['registration_id' => $reg->id, 'status' => 'valid']);
    $this->assertDatabaseHas('audit_logs', ['event' => 'registration.verified']);
});

it('forbids reviewing a registration that did not choose my school', function () {
    $school1 = School::query()->orderBy('id')->first();
    $school2 = School::query()->orderByDesc('id')->first();
    $path = AdmissionPath::query()->firstOrFail();

    $reg = submittedRegistration($school1, $path);
    $otherOperator = User::factory()->create(['role' => 'operator_sekolah', 'school_id' => $school2->id]);

    $before = $reg->fresh()->only(['status', 'is_kk_verified', 'is_ijazah_verified', 'is_alamat_verified']);

    $this->actingAs($otherOperator)->post("/verifikasi/{$reg->id}/review", [
        'status' => 'valid',
        'is_kk_verified' => 1,
        'is_ijazah_verified' => 1,
        'is_alamat_verified' => 1,
    ])->assertStatus(403);

    // The 403 must leave the row untouched: an out-of-scope reviewer may not
    // persist document flags (or any other write) before the scope check.
    expect($reg->fresh()->only(['status', 'is_kk_verified', 'is_ijazah_verified', 'is_alamat_verified']))
        ->toBe($before);
    $this->assertDatabaseMissing('verifications', ['registration_id' => $reg->id]);
});

it('denies pendaftar access to operator endpoints', function () {
    $user = User::factory()->create(['role' => 'pendaftar']);

    $this->actingAs($user)->get('/verifikasi')->assertStatus(403);
});

it('denies operator access to admin endpoints', function () {
    $operator = User::factory()->create(['role' => 'operator_sekolah']);

    $this->actingAs($operator)->get('/admin')->assertStatus(403);
});

it('allows admin_provinsi into admin', function () {
    $admin = User::factory()->create(['role' => 'admin_provinsi']);

    $this->actingAs($admin)->get('/admin')->assertOk();
});

it('permits profil view for every role', function () {
    $admin = User::factory()->create(['role' => 'admin_kabkota']);

    $this->actingAs($admin)->get('/dashboard')->assertOk();
});
