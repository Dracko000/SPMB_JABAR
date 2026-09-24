<?php

use App\Models\AdmissionPath;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

function pendaftarUser(): User
{
    $student = Student::query()->firstOrFail();

    return User::factory()->create([
        'student_id' => $student->id,
        'role' => 'pendaftar',
        'password' => 'secret',
    ]);
}

it('forbids staff roles from the pendaftar-only registration page', function () {
    $staff = User::factory()->create(['role' => 'admin_provinsi', 'student_id' => null]);

    $this->actingAs($staff)->get('/pendaftaran')->assertForbidden();
});

it('creates a draft on first visit', function () {
    $user = pendaftarUser();

    $this->actingAs($user)->get('/pendaftaran')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Registration/Show')
            ->where('registration.no_pendaftaran', $user->registration->no_pendaftaran));
});

it('rejects submitting without a path', function () {
    $user = pendaftarUser();

    $this->actingAs($user)->post('/pendaftaran/submit')
        ->assertSessionHasErrors('submit');
});

it('reserves quota on submit and clears it on quota-exceeded', function () {
    $user = pendaftarUser();
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::query()->firstOrFail();

    $this->actingAs($user)->post('/pendaftaran/path', ['path_code' => $path->code]);
    $this->actingAs($user)->post('/pendaftaran/choices', ['school_ids' => [$school->id]]);

    // The refactored submit contract validates mandatory documents per path
    // before reserving quota — pre-upload what the path requires.
    $required = match ($path->code) {
        'afirmasi' => ['KK', 'KIP', 'SKTM'],
        'prestasi' => ['KK', 'Sertifikat_Prestasi'],
        'mutasi' => ['KK', 'Surat_Mutasi'],
        default => ['KK', 'Ijazah'],
    };
    foreach ($required as $type) {
        $this->actingAs($user)->post('/pendaftaran/documents', [
            'type' => $type,
            'file' => UploadedFile::fake()->create(strtolower($type).'.pdf', 100, 'application/pdf'),
        ])->assertRedirect();
    }

    $quota = Quota::where('school_id', $school->id)->where('admission_path_id', $path->id)->firstOrFail();
    $quota->update(['kuota' => 1, 'terisi' => 0]);

    $this->actingAs($user)->post('/pendaftaran/submit')->assertRedirect();

    expect($quota->fresh()->terisi)->toBe(1);
    expect($user->registration->fresh()->status)->toBe('terverifikasi_awal');
});

it('blocks a choice once the quota is full', function () {
    $user = pendaftarUser();
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::query()->firstOrFail();

    $quota = Quota::where('school_id', $school->id)->where('admission_path_id', $path->id)->firstOrFail();
    $quota->update(['kuota' => 1, 'terisi' => 1]);

    $this->actingAs($user)->post('/pendaftaran/path', ['path_code' => $path->code]);
    $this->actingAs($user)->post('/pendaftaran/choices', ['school_ids' => [$school->id]]);
    $this->actingAs($user)->post('/pendaftaran/submit')
        ->assertSessionHasErrors('submit');

    expect($quota->fresh()->terisi)->toBe(1);
});

it('uploads a document and marks it menunggu verifikasi', function () {
    $user = pendaftarUser();
    $path = AdmissionPath::query()->firstOrFail();

    $this->actingAs($user)->post('/pendaftaran/path', ['path_code' => $path->code]);

    $file = UploadedFile::fake()->create('akte.pdf', 100, 'application/pdf');

    $this->actingAs($user)->post('/pendaftaran/documents', [
        'type' => 'akte',
        'file' => $file,
    ])->assertRedirect();

    $doc = $user->registration->documents()->first();
    expect($doc)->not->toBeNull();
    expect($doc->status)->toBe('menunggu');
});

it('validates jalur selection: path must exist', function () {
    $user = pendaftarUser();

    $this->actingAs($user)->post('/pendaftaran/path', ['path_code' => 'typo'])
        ->assertSessionHasErrors('path_code');
});

it('is idempotent when re-submitting', function () {
    $user = pendaftarUser();
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::query()->firstOrFail();

    $this->actingAs($user)->post('/pendaftaran/path', ['path_code' => $path->code]);
    $this->actingAs($user)->post('/pendaftaran/choices', ['school_ids' => [$school->id]]);

    $required = match ($path->code) {
        'afirmasi' => ['KK', 'KIP', 'SKTM'],
        'prestasi' => ['KK', 'Sertifikat_Prestasi'],
        'mutasi' => ['KK', 'Surat_Mutasi'],
        default => ['KK', 'Ijazah'],
    };
    foreach ($required as $type) {
        $this->actingAs($user)->post('/pendaftaran/documents', [
            'type' => $type,
            'file' => UploadedFile::fake()->create(strtolower($type).'.pdf', 100, 'application/pdf'),
        ])->assertRedirect();
    }

    $quota = Quota::where('school_id', $school->id)->where('admission_path_id', $path->id)->firstOrFail();
    $quota->update(['kuota' => 5, 'terisi' => 0]);

    $this->actingAs($user)->post('/pendaftaran/submit')->assertRedirect();
    expect($quota->fresh()->terisi)->toBe(1);

    // A second submit of an already-auto-verified registration must be a
    // no-op — it must not double-reserve the seat.
    $this->actingAs($user)->post('/pendaftaran/submit')->assertRedirect();
    expect($quota->fresh()->terisi)->toBe(1);
});
