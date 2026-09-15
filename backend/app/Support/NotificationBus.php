<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

/**
 * ponytail: publication seam. Task 7 builds the real NotificationBus
 * (DatabaseChannel + LogChannel) and takes this over — the engine only
 * depends on the event name + payload the bus will dispatch, so selection
 * publish stays decoupled from notifications until the bus lands. log()
 * still sinks the payload so the publish path is observable today.
 */
final class NotificationBus
{
    public function dispatch(string $event, int $recipientId, array $payload = []): void
    {
        Log::info('notification.enqueued', [
            'event' => $event,
            'recipient_id' => $recipientId,
            'payload' => $payload,
        ]);
    }
}
