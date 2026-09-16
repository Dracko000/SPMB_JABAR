<?php

use App\Models\User;

it('renders the staff login page for guests', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->component('Auth/StaffLogin'));
});

it('signs in a staff user and redirects by role', function () {
    // admin_provinsi seeded by UserSeeder
    $admin = User::where('role', 'admin_provinsi')->firstOrFail()->fresh();
    $admin->update(['password' => 'password']);

    $this->post('/login', ['email' => $admin->email, 'password' => 'password'])
        ->assertRedirect('/admin');

    $this->assertAuthenticatedAs($admin);
});

it('redirects an operator to the verification queue', function () {
    $op = User::where('role', 'operator_sekolah')->firstOrFail()->fresh();
    $op->update(['password' => 'password']);

    $this->post('/login', ['email' => $op->email, 'password' => 'password'])
        ->assertRedirect('/verifikasi');

    $this->get('/verifikasi')->assertOk(); // now authenticated, not a 500 on unauthenticated
});

it('rejects bad credentials', function () {
    $this->post('/login', ['email' => 'admin.provinsi@spmb.jabar', 'password' => 'wrong'])
        ->assertSessionHasErrors('email')
        ->assertRedirect();

    $this->assertGuest();
});

it('guest hitting an auth route is redirected to login, not 500', function () {
    $this->get('/admin')
        ->assertRedirect('/login');
});