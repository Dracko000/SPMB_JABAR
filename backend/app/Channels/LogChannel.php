<?php

namespace App\Channels;

use App\Support\NotificationEvent;

/** Seam for email/SMS/WhatsApp delivery — currently logs the event. */
class LogChannel
{
    public function send(NotificationEvent $event): void
    {
        logger()->info("[notification] {$event->type} -> user {$event->userId}: ".json_encode($event->data));
    }
}