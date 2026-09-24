<?php

use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

it('renders the unified login page for guests', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Auth/Login'));
});

it('signs in a staff user and redirects by role', function () {
    // admin_provinsi seeded by UserSeeder
    $admin = User::where('role', 'admin_provinsi')->firstOrFail()->fresh();
    $admin->update(['password' => 'password']);

    $this->post('/login', ['identifier' => $admin->email, 'password' => 'password'])
        ->assertRedirect('/admin');

    $this->assertAuthenticatedAs($admin);
});

it('redirects an operator to the verification queue', function () {
    $op = User::where('role', 'operator_sekolah')->firstOrFail()->fresh();
    $op->update(['password' => 'password']);

    $this->post('/login', ['identifier' => $op->email, 'password' => 'password'])
        ->assertRedirect('/verifikasi');

    $this->get('/verifikasi')->assertOk(); // now authenticated, not a 500 on unauthenticated
});

it('rejects bad credentials', function () {
    $this->post('/login', ['identifier' => 'admin.provinsi@spmb.jabar', 'password' => 'wrong'])
        ->assertSessionHasErrors('identifier')
        ->assertRedirect();

    $this->assertGuest();
});

it('guest hitting an auth route is redirected to login, not 500', function () {
    $this->get('/admin')
        ->assertRedirect('/login');
});

it('signs in a pendaftar via NISN (NISN-as-password)', function () {
    $student = Student::query()->firstOrFail();
    $user = User::factory()->create([
        'role' => 'pendaftar',
        'student_id' => $student->id,
        'password' => 'secret',
    ]);

    $this->post('/login', ['identifier' => $student->nisn, 'password' => $student->nisn])
        ->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});
