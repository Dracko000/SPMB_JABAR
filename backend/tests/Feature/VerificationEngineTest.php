<?php

use App\Engines\VerificationEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Document;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

/**
 * Build a registration that satisfies the current VerificationEngine inputs:
 * linked pendaftar user → student (NIK + birthdate) → path → choice → docs.
 */
function ve_Registration(Student $student, array $overrides = []): Registration
{
    $user = User::factory()->create([
        'role' => 'pendaftar',
        'student_id' => $student->id,
    ]);

    $registration = Registration::create(array_merge([
        'no_pendaftaran' => 'SPMB'.now()->year.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'user_id' => $user->id,
        'admission_period_id' => AdmissionPeriod::where('is_active', true)->firstOrFail()->id,
        'admission_path_id' => AdmissionPath::where('code', 'zonasi')->firstOrFail()->id,
        'status' => 'draft',
    ], $overrides));

    RegistrationChoice::create([
        'registration_id' => $registration->id,
        'school_id' => School::query()->firstOrFail()->id,
        'priority' => 1,
    ]);

    return $registration;
}

/** Upload the Zonasi mandatory documents (KK + Ijazah). */
function ve_UploadMandatoryDocs(Registration $registration, array $types = ['KK', 'Ijazah']): void
{
    foreach ($types as $type) {
        Document::create([
            'registration_id' => $registration->id,
            'type' => $type,
            'path' => "documents/dummy/{$type}.pdf",
            'status' => 'menunggu',
        ]);
    }
}

function ve_Student(array $overrides = []): Student
{
    return Student::create(array_merge([
        'nisn' => random_int(1000000000, 9999999999),
        'nik' => '32'.str_pad((string) random_int(0, 99999999999999), 14, '0', STR_PAD_LEFT),
        'nama' => 'Verifikasi Test Siswa',
        'tempat_lahir' => 'Bandung',
        'tanggal_lahir' => '2012-03-10',
        'jenis_kelamin' => 'P',
        'agama' => 'Islam',
        'nilai_prestasi' => 90,
        'jarak_domisili_km' => 1.0,
        'status_peserta' => 'calon',
        'source' => 'mock',
    ], $overrides));
}

it('passes a complete registration and marks it terverifikasi_awal', function () {
    $registration = ve_Registration(ve_Student());
    ve_UploadMandatoryDocs($registration);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->status)->toBe('terverifikasi_awal');
});

it('flags a missing NIK as perlu_perbaikan', function () {
    $registration = ve_Registration(ve_Student(['nik' => '']));
    ve_UploadMandatoryDocs($registration);

    app(VerificationEngine::class)->run($registration);

    $fresh = $registration->fresh();
    expect($fresh->status)->toBe('perlu_perbaikan');
    expect(str_contains($fresh->verification_notes, 'NIK belum terverifikasi.'))->toBeTrue();
});

it('flags an underage student as perlu_perbaikan', function () {
    $registration = ve_Registration(ve_Student(['tanggal_lahir' => now()->subYears(10)]));
    ve_UploadMandatoryDocs($registration);

    app(VerificationEngine::class)->run($registration);

    $fresh = $registration->fresh();
    expect($fresh->status)->toBe('perlu_perbaikan');
    expect(str_contains($fresh->verification_notes, 'Usia siswa tidak memenuhi syarat minimum.'))->toBeTrue();
});

it('flags missing mandatory documents as perlu_perbaikan', function () {
    $registration = ve_Registration(ve_Student());

    app(VerificationEngine::class)->run($registration);

    $fresh = $registration->fresh();
    expect($fresh->status)->toBe('perlu_perbaikan');
    expect(str_contains($fresh->verification_notes, 'KK'))->toBeTrue();
    expect(str_contains($fresh->verification_notes, 'Ijazah'))->toBeTrue();
});
