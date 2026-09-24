<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function logEvent(string $event, $model, ?array $oldValues = null, ?array $newValues = null)
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'event' => $event,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public function auditUpdate(array $changedAttributes)
    {
        $oldValues = [];
        $newValues = [];

        foreach ($changedAttributes as $key => $value) {
            $oldValues[$key] = $this->getOriginal($key);
            $newValues[$key] = $value;
        }

        static::logEvent('updated', $this, $oldValues, $newValues);
    }
}
