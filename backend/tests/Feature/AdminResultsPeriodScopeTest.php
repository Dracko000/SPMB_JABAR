<?php

use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\School;
use App\Models\SelectionResult;
use App\Models\Student;
use App\Models\User;

it('admin selection results are scoped to the active period only', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();
    $active = AdmissionPeriod::where('is_active', true)->firstOrFail();

    // A selection result from a DIFFERENT (historical) period.
    $other = AdmissionPeriod::query()->firstOrFail();
    $other->update(['year' => $other->year, 'is_active' => false]);
    $student = Student::query()->firstOrFail();
    $path = \App\Models\AdmissionPath::where('code', 'prestasi')->firstOrFail();
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
        'school_id' => School::query()->firstOrFail()->id,
        'composite_score' => 80.0,
        'status' => 'selected',
        'rank' => 1,
        'priority_used' => 1,
    ]);

    $this->actingAs($admin)->get('/admin')
        ->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Admin/Dashboard')
            ->has('selectionResults', 0));
});