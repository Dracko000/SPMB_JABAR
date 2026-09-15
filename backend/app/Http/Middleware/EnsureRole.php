<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    /**
     * Guard a route to one or more roles (PRD §24 RBAC).
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        abort_unless($user, 401);

        abort_unless(in_array($user->role, $roles, true), 403, 'Akses ditolak untuk peran Anda.');

        return $next($request);
    }
}