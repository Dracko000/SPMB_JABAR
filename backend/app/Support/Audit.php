<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Audit
{
    /**
     * Log a system event with full forensic context.
     *
     * @param  string  $event  event name, e.g. 'registration.submitted'
     * @param  array  $details  free-form context payload (stored in new_values)
     * @param  Model|null  $auditable  optional model the event is about, stored
     *                                 as a polymorphic morph for forensics
     */
    public static function log(string $event, array $details = [], ?Model $auditable = null): AuditLog
    {
        $morph = $auditable
            ? ['auditable_type' => $auditable->getMorphClass(), 'auditable_id' => $auditable->getKey()]
            : [];

        return AuditLog::create(array_merge($morph, [
            'user_id' => Auth::id(),
            'event' => $event,
            'new_values' => $details,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_path' => request()->fullUrl(),
        ]));
    }
}
