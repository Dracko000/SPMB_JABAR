<?php

use App\Engines\SelectionEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\SelectionResult;
use App\Models\Student;

function se_Registration(Student $student, int $pathId, array $choices): Registration
{
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $registration = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'X'.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'admission_period_id' => $period->id,
        'admission_path_id' => $pathId,
        'status' => 'verified',
    ]);
    foreach ($choices as $i => $schoolId) {
        RegistrationChoice::create(['registration_id' => $registration->id, 'school_id' => $schoolId, 'priority' => $i + 1]);
    }

    return $registration;
}

it('ranks by score and stops at quota', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $top = Student::query()->firstOrFail();
    $top->update(['nilai_prestasi' => 99, 'jarak_domisili_km' => 1]);
    $low = Student::query()->orderByDesc('id')->firstOrFail();
    $low->update(['nilai_prestasi' => 50, 'jarak_domisili_km' => 20]);

    se_Registration($top, $path->id, [$school->id]);
    se_Registration($low, $path->id, [$school->id]);

    $engine = app(SelectionEngine::class);
    $result = $engine->dryRun(AdmissionPeriod::where('is_active', true)->firstOrFail());

    $rows = $result['schools'][0]['rows'];
    expect($rows)->toHaveCount(1);          // quota 1
    expect($rows[0]['nama'])->toBe($top->nama);
    expect(SelectionResult::count())->toBe(0); // dry-run persists nothing
});

it('assigns higher-priority school first', function () {
    $path = AdmissionPath::where('code', 'zonasi')->firstOrFail();
    $s1 = School::query()->firstOrFail();
    $s2 = School::query()->orderBy('id')->get()[1];

    // Priority-1 choice must be rejected so priority-2 is used.
    Quota::updateOrCreate(['school_id' => $s1->id, 'admission_path_id' => $path->id], ['kuota' => 0, 'terisi' => 0]);
    Quota::updateOrCreate(['school_id' => $s2->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $student = Student::query()->firstOrFail();
    $student->update(['nilai_prestasi' => 90, 'jarak_domisili_km' => 5]);
    $registration = se_Registration($student, $path->id, [$s1->id, $s2->id]);

    $engine = app(SelectionEngine::class);
    $engine->publish(AdmissionPeriod::where('is_active', true)->firstOrFail());

    $assigned = SelectionResult::where('registration_id', $registration->id)->where('status', 'selected')->first();
    expect($assigned)->not->toBeNull();
    expect($assigned->school_id)->toBe((int) $s2->id);

    $skipped = SelectionResult::where('registration_id', $registration->id)->where('status', 'not_selected')->first();
    expect($skipped)->not->toBeNull();
    expect($skipped->school_id)->toBe((int) $s1->id);
    expect($skipped->rank)->toBeNull();
});

it('publishes idempotently — prior results replaced with a fresh run_id', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $student = Student::query()->firstOrFail();
    $student->update(['nilai_prestasi' => 88, 'jarak_domisili_km' => 5]);
    se_Registration($student, $path->id, [$school->id]);

    $engine = app(SelectionEngine::class);
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();

    $engine->publish($period);
    $firstRun = SelectionResult::where('status', 'selected')->value('run_id');
    expect(SelectionResult::count())->toBe(1);

    $engine->publish($period);

    expect(SelectionResult::count())->toBe(1);
    expect(SelectionResult::where('status', 'selected')->value('run_id'))->not->toBe($firstRun);
});

it('awards one school per student across paths by path priority', function () {
    $student = Student::query()->firstOrFail();
    $student->update(['nilai_prestasi' => 95, 'jarak_domisili_km' => 1]);

    $school = School::query()->firstOrFail();
    $zonasi = AdmissionPath::where('code', 'zonasi')->firstOrFail();
    $prestasi = AdmissionPath::where('code', 'prestasi')->firstOrFail();

    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $zonasi->id], ['kuota' => 1, 'terisi' => 0]);
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $prestasi->id], ['kuota' => 1, 'terisi' => 0]);

    $regZonasi = se_Registration($student, $zonasi->id, [$school->id]);
    $regPrestasi = se_Registration($student, $prestasi->id, [$school->id]);

    $engine = app(SelectionEngine::class);
    $engine->publish(AdmissionPeriod::where('is_active', true)->firstOrFail());

    expect(SelectionResult::where('registration_id', $regZonasi->id)->where('status', 'selected')->count())->toBe(1);
    expect(SelectionResult::where('registration_id', $regPrestasi->id)->where('status', 'selected')->count())->toBe(0);
    expect(SelectionResult::where('registration_id', $regPrestasi->id)->where('status', 'not_selected')->count())->toBe(1);
});
