<?php

namespace App\Support;

/**
 * Dispatches a notification event to every registered channel. Channels are
 * injected at container build time (see AppServiceProvider) — add email/SMS/
 * WhatsApp channels here later without touching dispatch sites.
 */
final class NotificationBus
{
    /** @param array<int, object> $channels */
    public function __construct(private readonly array $channels) {}

    public function dispatch(string $type, int $userId, array $data = []): void
    {
        $event = new NotificationEvent($type, $userId, $data);

        foreach ($this->channels as $channel) {
            $channel->send($event);
        }
    }
}