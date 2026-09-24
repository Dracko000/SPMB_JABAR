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
        ];
    }
}
