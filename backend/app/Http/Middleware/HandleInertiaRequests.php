<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'school' => $user->school?->only('id', 'name'),
                ] : null,
            ],
            'flash' => fn () => [
                'success' => $request->session()->get('success') ?? $request->session()->get('flash.success'),
            ],
            // Client-side console guard is a deterrence/audit feature, not a
            // security control. Only mounted for authenticated sessions:
            // public pages carry no sensitive payload, and blocking right-click
            // there would break saving public PDFs/announcements for nothing.
            'security' => fn () => [
                'consoleGuard' => (bool) config('security.console_guard', false) && $request->user() !== null,
                'consoleReportUrl' => config('security.console_guard_audit', true) ? route('security.console.report') : null,
            ],
        ];
    }
}
