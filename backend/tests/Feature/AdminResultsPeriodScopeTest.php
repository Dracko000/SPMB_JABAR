<?php

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\School;
use App\Models\SelectionResult;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('admin selection results are scoped to the active period only', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();
    $active = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    $student = Student::query()->firstOrFail();

    // A historical period (not the seed row — keep the active seed intact).
    $other = AdmissionPeriod::create([
        'year' => now()->year - 1,
        'registration_start' => now()->subYear(),
        'registration_end' => now()->subYear()->addMonth(),
        'is_active' => false,
    ]);
    $student = Student::query()->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    $reg = Registration::create([
        'no_pendaftaran' => 'SPMB'.(now()->year - 1).'X'.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'admission_period_id' => $other->id,
        'admission_path_id' => $path->id,
        'status' => 'verified',
    ]);
    SelectionResult::create([
        'registration_id' => $reg->id,
        'admission_path_id' => $path->id,
        'school_id' => $school->id,
        'composite_score' => 80.0,
        'status' => 'selected',
        'rank' => 1,
        'priority_used' => 1,
    ]);

    // Positive control — a result in the ACTIVE period MUST be shown.
    $activeReg = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'X'.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'admission_period_id' => $active->id,
        'admission_path_id' => $path->id,
        'status' => 'verified',
    ]);
    SelectionResult::create([
        'registration_id' => $activeReg->id,
        'admission_path_id' => $path->id,
        'school_id' => $school->id,
        'composite_score' => 90.0,
        'status' => 'selected',
        'rank' => 1,
        'priority_used' => 1,
    ]);

    $this->actingAs($admin)->get('/admin')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Dashboard')
            ->has('selectionResults', 1));
});
