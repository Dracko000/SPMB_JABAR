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

function tb_Registration(Student $student, int $pathId, array $schoolIds): Registration
{
    $registration = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'T'.random_int(100000, 999999),
        'student_id' => $student->id,
        'admission_period_id' => AdmissionPeriod::where('is_active', true)->firstOrFail()->id,
        'admission_path_id' => $pathId,
        'status' => 'verified',
    ]);
    foreach ($schoolIds as $i => $schoolId) {
        RegistrationChoice::create(['registration_id' => $registration->id, 'school_id' => $schoolId, 'priority' => $i + 1]);
    }

    return $registration;
}

it('honors age_youngest tie-break — youngest student wins equal scores (zonasi rule)', function () {
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $school = School::query()->firstOrFail();
    $zone = AdmissionPath::where('code', 'zonasi')->firstOrFail();

    // Seeded zonasi rule: distance-heavy ages first via tie_break.
    $rule = $zone->rules()->where('is_active', true)->firstOrFail();
    $rule->update(['tie_break' => 'age_youngest']);
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $zone->id], ['kuota' => 1, 'terisi' => 0]);

    // Two students, identical distance + score → tie decided by age.
    $younger = Student::query()->firstOrFail();
    $younger->update(['jarak_domisili_km' => 5, 'nilai_prestasi' => 0, 'tanggal_lahir' => now()->subYears(13)]);
    $older = Student::query()->orderByDesc('id')->firstOrFail();
    $older->update(['jarak_domisili_km' => 5, 'nilai_prestasi' => 0, 'tanggal_lahir' => now()->subYears(17)]);

    // Older submits FIRST; younger submits LATER. age_youngest must still win.
    $regOlder = tb_Registration($older, $zone->id, [$school->id]);
    $regOlder->update(['created_at' => now()->subDays(5)]);
    $regYounger = tb_Registration($younger, $zone->id, [$school->id]);
    $regYounger->update(['created_at' => now()]);

    $result = app(SelectionEngine::class)->dryRun($period);
    $rows = collect($result['schools'][0]['rows']);
    expect($rows->first()['nama'])->toBe($younger->nama);
    expect(SelectionResult::count())->toBe(0);
});

it('date_submitted_asc tie-break — earliest submit wins equal scores (prestasi rule)', function () {
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();

    $rule = $path->rules()->where('is_active', true)->firstOrFail();
    $rule->update(['tie_break' => 'date_submitted_asc']);
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $early = Student::query()->firstOrFail();
    $early->update(['nilai_prestasi' => 80, 'jarak_domisili_km' => 5]);
    $late = Student::query()->orderByDesc('id')->firstOrFail();
    $late->update(['nilai_prestasi' => 80, 'jarak_domisili_km' => 5]);

    $regEarly = tb_Registration($early, $path->id, [$school->id]);
    $regEarly->update(['created_at' => now()->subDays(5)]);
    $regLate = tb_Registration($late, $path->id, [$school->id]);
    $regLate->update(['created_at' => now()]);

    $result = app(SelectionEngine::class)->dryRun($period);
    $rows = collect($result['schools'][0]['rows']);
    expect($rows->first()['nama'])->toBe($early->nama);
    expect(SelectionResult::count())->toBe(0);
});

it('no tie-break conflict with different scores — higher score always wins', function () {
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $school = School::query()->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();

    $rule = $path->rules()->where('is_active', true)->firstOrFail();
    $rule->update(['tie_break' => 'age_youngest']);
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $top = Student::query()->firstOrFail();
    $top->update(['nilai_prestasi' => 95, 'jarak_domisili_km' => 1]);
    $low = Student::query()->orderByDesc('id')->firstOrFail();
    $low->update(['nilai_prestasi' => 50, 'jarak_domisili_km' => 20]);

    tb_Registration($top, $path->id, [$school->id]);
    tb_Registration($low, $path->id, [$school->id]);

    $rows = collect(app(SelectionEngine::class)->dryRun($period)['schools'][0]['rows']);
    expect($rows->first()['nama'])->toBe($top->nama);
});
