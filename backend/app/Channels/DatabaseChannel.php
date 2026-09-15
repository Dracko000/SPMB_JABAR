<?php

namespace App\Channels;

use App\Models\Notification;
use App\Support\NotificationEvent;

class DatabaseChannel
{
    public function send(NotificationEvent $event): void
    {
        Notification::create([
            'user_id' => $event->userId,
            'type' => $event->type,
            'payload' => $event->data,
        ]);
    }
}
