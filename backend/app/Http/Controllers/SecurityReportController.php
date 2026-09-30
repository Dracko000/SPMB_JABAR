<?php

namespace App\Http\Controllers;

use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Receives client-side console/devtools detection reports.
 *
 * This is a DETERRENCE + ACCOUNTABILITY feature, not a security control: the
 * browser will always let its user open devtools, so the point of recording it
 * is that misuse becomes visible in the audit trail rather than invisible.
 */
class SecurityReportController extends Controller
{
    /**
     * Throttle per session+IP so a broken client cannot flood the audit log.
     */
    public function consoleAttempt(Request $request): JsonResponse
    {
        if (! config('security.console_guard_audit', true)) {
            return response()->json(['ok' => false], 404);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:40'],
            'path' => ['nullable', 'string', 'max:255'],
        ]);

        Audit::log('security.console.attempt', [
            'reason' => $validated['reason'],
            'path' => $validated['path'] ?? $request->path(),
        ]);

        return response()->json(['ok' => true]);
    }
}
