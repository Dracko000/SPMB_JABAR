<?php

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function dashboardUser(): User
{
    return User::factory()->create([
        'role' => 'pendaftar',
        'student_id' => Student::query()->firstOrFail()->id,
        'password' => 'secret',
    ]);
}

it('pendaftar dashboard exposes unread notification counts and marks all read on the read route', function () {
    $user = dashboardUser();

    Notification::create(['user_id' => $user->id, 'type' => 'selection.published', 'payload' => ['foo' => 'bar']]);
    Notification::create(['user_id' => $user->id, 'type' => 'registration.submitted', 'payload' => []]);

    $this->actingAs($user)->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Pendaftar')
            ->where('notifications_unread', 2)
            ->has('notifications', 2));

    $this->actingAs($user)->post('/notifications/read')
        ->assertRedirect();

    $this->assertDatabaseMissing('notifications', ['user_id' => $user->id, 'read_at' => null]);
});
