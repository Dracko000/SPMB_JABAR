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