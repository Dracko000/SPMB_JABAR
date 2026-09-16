<?php

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

it('admin provinsi can dry-run without persisting', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();

    $response = $this->actingAs($admin)->post('/admin/seleksi/dry-run');
    $response->assertOk();
    $this->assertDatabaseCount('selection_results', 0);
});

it('admin provinsi can publish selection results', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    \App\Models\Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $student = Student::query()->orderByDesc('id')->firstOrFail();
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $reg = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'X'.random_int(10000000, 99999999),
        'student_id' => $student->id, 'admission_period_id' => $period->id,
        'admission_path_id' => $path->id, 'status' => 'verified',
    ]);
    RegistrationChoice::create(['registration_id' => $reg->id, 'school_id' => $school->id, 'priority' => 1]);

    $this->actingAs($admin)->post('/admin/seleksi/publish');

    $this->assertDatabaseHas('selection_results', ['registration_id' => $reg->id, 'status' => 'selected']);
});

it('non-admin is denied', function () {
    $user = User::factory()->create(['role' => 'pendaftar']);

    $this->actingAs($user)->post('/admin/seleksi/dry-run')->assertForbidden();
});

it('admin_kabkota cannot run or publish selection (provinsi-only)', function () {
    $kabkota = User::factory()->create(['role' => 'admin_kabkota']);

    $this->actingAs($kabkota)->post('/admin/seleksi/dry-run')->assertForbidden();
    $this->actingAs($kabkota)->post('/admin/seleksi/publish')->assertForbidden();
});

it('admin_kabkota cannot edit selection rules (provinsi-only)', function () {
    $kabkota = User::factory()->create(['role' => 'admin_kabkota']);
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();

    $this->actingAs($kabkota)->post('/admin/seleksi/rules', [
        'path_id' => $path->id, 'score_weight' => 0.5, 'distance_weight' => 0.5,
        'tie_break' => 'date_submitted_asc',
    ])->assertForbidden();

    // Seeded rule for prestasi unchanged — no upsert happened through the guard.
    $this->assertDatabaseHas('selection_rules', ['admission_path_id' => $path->id, 'score_weight' => 0.900]);
});