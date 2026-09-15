<?php

namespace App\Support;

readonly class NotificationEvent
{
    public function __construct(
        public string $type,
        public int $userId,
        public array $data = [],
    ) {}
}
