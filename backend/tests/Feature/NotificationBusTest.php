<?php

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use App\Support\NotificationBus;

it('persists a database notification row', function () {
    $user = User::factory()->create([
        'role' => 'pendaftar',
        'student_id' => Student::query()->firstOrFail()->id,
    ]);

    app(NotificationBus::class)->dispatch('registration.submitted', $user->id, ['foo' => 'bar']);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $user->id,
        'type' => 'registration.submitted',
    ]);
    expect(Notification::where('user_id', $user->id)->firstOrFail()->payload)->toBe(['foo' => 'bar']);
});