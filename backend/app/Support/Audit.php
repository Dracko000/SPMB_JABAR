<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class Audit
{
    public static function log(string $action, array $payload = []): AuditLog
    {
        return AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'payload' => json_encode($payload),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}