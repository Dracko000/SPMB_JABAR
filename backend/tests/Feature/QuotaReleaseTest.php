<?php

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\VerificationFlow;

function qr_Registration(Student $student, int $pathId, array $schoolIds, string $status = 'submitted'): Registration
{
    $registration = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'Q'.random_int(100000, 999999),
        'student_id' => $student->id,
        'admission_period_id' => AdmissionPeriod::where('is_active', true)->firstOrFail()->id,
        'admission_path_id' => $pathId,
        'status' => $status,
    ]);
    foreach ($schoolIds as $i => $schoolId) {
        RegistrationChoice::create(['registration_id' => $registration->id, 'school_id' => $schoolId, 'priority' => $i + 1]);
    }

    return $registration;
}

/** Operator bound to $schoolId — returns [$operator, $school]. */
function qr_Operator(int $schoolId): array
{
    $school = School::query()->findOrFail($schoolId);
    $operator = User::factory()->create([
        'role' => 'operator_sekolah',
        'school_id' => $school->id,
    ]);

    return [$operator, $school];
}

it('a rejected registration frees every reserved choice', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $s1 = School::query()->firstOrFail();
    $s2 = School::query()->orderBy('id')->get()[1];

    // Two seats reserved at s2, one at s1.
    Quota::updateOrCreate(['school_id' => $s1->id, 'admission_path_id' => $path->id], ['kuota' => 3, 'terisi' => 1]);
    Quota::updateOrCreate(['school_id' => $s2->id, 'admission_path_id' => $path->id], ['kuota' => 3, 'terisi' => 2]);

    [$operator] = qr_Operator((int) $s2->id);
    $student = Student::query()->firstOrFail();
    $reg = qr_Registration($student, $path->id, [$s1->id, $s2->id]);

    app(VerificationFlow::class)->review($reg, $operator, 'ditolak', 'Kriteria tidak sesuai.');

    $this->assertDatabaseHas('quotas', ['school_id' => $s1->id, 'admission_path_id' => $path->id, 'terisi' => 0]);
    $this->assertDatabaseHas('quotas', ['school_id' => $s2->id, 'admission_path_id' => $path->id, 'terisi' => 1]);
});

it('releases a seat on perbaikan too — a fresh submission re-reserves', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    $quota = Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 3, 'terisi' => 1]);

    [$operator] = qr_Operator((int) $school->id);
    $student = Student::query()->firstOrFail();
    $reg = qr_Registration($student, $path->id, [$school->id]);

    app(VerificationFlow::class)->review($reg, $operator, 'perbaikan', 'Lengkapi ijazah.');

    expect($quota->fresh()->terisi)->toBe(0);
});

it('a rejected registration cannot be re-reviewed — no double release', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    $quota = Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 3, 'terisi' => 1]);

    [$operator] = qr_Operator((int) $school->id);
    $student = Student::query()->firstOrFail();
    $reg = qr_Registration($student, $path->id, [$school->id]);

    app(VerificationFlow::class)->review($reg, $operator, 'ditolak');
    expect($quota->fresh()->terisi)->toBe(0);

    // Second (duplicate) review must be refused, not release again.
    expect(fn () => app(VerificationFlow::class)->review($reg, $operator, 'ditolak'))
        ->toThrow(InvalidArgumentException::class);
    expect($quota->fresh()->terisi)->toBe(0);
});

it('release is a no-op when no seat was reserved', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 3, 'terisi' => 0]);

    [$operator] = qr_Operator((int) $school->id);
    $student = Student::query()->firstOrFail();
    $reg = qr_Registration($student, $path->id, [$school->id]);

    app(VerificationFlow::class)->review($reg, $operator, 'ditolak');

    $this->assertDatabaseHas('quotas', ['school_id' => $school->id, 'admission_path_id' => $path->id, 'terisi' => 0]);
});
