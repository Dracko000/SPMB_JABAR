<?php

use App\Engines\VerificationEngine;
use App\Integration\DataIntegrationGateway;
use App\Integration\StudentRecord;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\Student;
use Mockery\MockInterface;

function ve_Registration(Student $student, array $overrides = []): Registration
{
    return Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'admission_period_id' => AdmissionPeriod::where('is_active', true)->firstOrFail()->id,
        'user_id' => null,
        'admission_path_id' => null,
        'status' => 'draft',
        ...$overrides,
    ]);
}

/**
 * The MockAdapter reads the same `students` row that a registration references,
 * so a mutation makes "submitted" and "canonical source" match. Bind a fake
 * gateway so the canonical record comes from a StudentRecord, not the row.
 */
function ve_fakeGatewayThatReturns(StudentRecord $record): MockInterface
{
    $gateway = Mockery::mock(DataIntegrationGateway::class);
    $gateway->shouldReceive('lookupByNisn')->with($record->nisn)->andReturn($record);

    app()->instance(DataIntegrationGateway::class, $gateway);

    return $gateway;
}

// Laravel boots a fresh app container per test, so the mock cannot normally
// leak — this is defensive: drop the instance so the AppServiceProvider
// singleton re-resolves on the next access regardless of test ordering.
afterEach(function () {
    app()->forgetInstance(DataIntegrationGateway::class);
});

function ve_canonicalRecord(Student $student): StudentRecord
{
    return StudentRecord::fromArray([
        'nisn' => $student->nisn,
        'nik' => $student->nik,
        'nama' => $student->nama,
        'tempat_lahir' => $student->tempat_lahir,
        'tanggal_lahir' => $student->tanggal_lahir?->toDateString(),
        'jenis_kelamin' => $student->jenis_kelamin,
        'sekolah_asal' => $student->educationRecord?->sekolah_asal,
        'nama_ayah' => $student->parent?->nama_ayah,
        'nama_ibu' => $student->parent?->nama_ibu,
    ]);
}

it('marks a matching registration VALID with all PASS', function () {
    $student = Student::query()->firstOrFail();
    ve_fakeGatewayThatReturns(ve_canonicalRecord($student));
    $registration = ve_Registration($student);

    $engine = app(VerificationEngine::class);
    $fields = $engine->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('VALID');
    expect(array_filter($fields, fn ($v) => $v === 'FAIL'))->toBeEmpty();
});

it('flags a mismatched NIK as DATA TIDAK SESUAI', function () {
    $student = Student::query()->firstOrFail();

    // Snapshot the canonical record BEFORE mutating the submitted row, so the
    // gateway still returns the original NIK while the registration's student
    // claims a different one. The expect below makes the ordering provable.
    $canonical = ve_canonicalRecord($student);
    expect($canonical->nik)->not->toBe('3201010101010101');

    ve_fakeGatewayThatReturns($canonical);
    $student->update(['nik' => '3201010101010101']);
    $registration = ve_Registration($student);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('DATA TIDAK SESUAI');
    expect($registration->fresh()->verification_evidence['fields']['nik'])->toBe('FAIL');
});

it('returns PERLU VERIFIKASI on a SKIP mix with no FAIL', function () {
    $student = Student::query()->firstOrFail();

    // Absent side-data: null tempat_lahir, no parent/education rows. The schema
    // keeps tanggal_lahir NOT NULL, so it stays present+equal (PASS) — the mix
    // still exercises the SKIP branch without any FAIL.
    $student->update(['tempat_lahir' => null]);
    $student->parent?->delete();
    $student->educationRecord?->delete();
    $student->unsetRelation('parent')->unsetRelation('educationRecord');

    // Canonical built AFTER the deletions: those fields are null on both
    // sides too, which is exactly the partial-evidence scenario → SKIP.
    ve_fakeGatewayThatReturns(ve_canonicalRecord($student));
    $registration = ve_Registration($student);

    $fields = app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('PERLU VERIFIKASI');
    expect(array_filter($fields, fn ($v) => $v === 'FAIL'))->toBeEmpty();
    expect(array_filter($fields, fn ($v) => $v === 'SKIP'))->not->toBeEmpty();
});

it('does NOT change registration status', function () {
    $student = Student::query()->firstOrFail();
    $registration = ve_Registration($student, ['status' => 'draft']);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->status)->toBe('draft');
});
