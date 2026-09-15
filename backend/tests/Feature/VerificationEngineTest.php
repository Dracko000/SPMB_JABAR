<?php

use App\Engines\VerificationEngine;
use App\Integration\DataIntegrationGateway;
use App\Integration\StudentRecord;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\Student;
use Mockery\MockInterface;

function verificationRegistration(Student $student, array $overrides = []): Registration
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
function fakeGatewayThatReturns(StudentRecord $record): MockInterface
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

function canonicalRecord(Student $student): StudentRecord
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
    fakeGatewayThatReturns(canonicalRecord($student));
    $registration = verificationRegistration($student);

    $engine = app(VerificationEngine::class);
    $fields = $engine->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('VALID');
    expect(array_filter($fields, fn ($v) => $v === 'FAIL'))->toBeEmpty();
});

it('flags a mismatched NIK as DATA TIDAK SESUAI', function () {
    $student = Student::query()->firstOrFail();
    fakeGatewayThatReturns(canonicalRecord($student));
    $student->update(['nik' => '3201010101010101']);
    $registration = verificationRegistration($student);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('DATA TIDAK SESUAI');
    expect($registration->fresh()->verification_evidence['fields']['nik'])->toBe('FAIL');
});

it('does NOT change registration status', function () {
    $student = Student::query()->firstOrFail();
    $registration = verificationRegistration($student, ['status' => 'draft']);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->status)->toBe('draft');
});