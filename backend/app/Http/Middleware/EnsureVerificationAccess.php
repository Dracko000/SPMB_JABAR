<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Akses area verifikasi:
 *  - peran operator_sekolah / verifikator (divisi sekolah masing-masing), atau
 *  - superadmin, atau
 *  - siapa pun yang diberi hak 'can_verify_all' oleh superadmin
 *    (verifikasi SELURUH pendaftar lintas sekolah).
 */
class EnsureVerificationAccess
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        abort_unless($user, 401);

        $allowed = in_array($user->role, ['operator_sekolah', 'verifikator', 'superadmin'], true)
            || (bool) $user->can_verify_all;

        abort_unless($allowed, 403, 'Akses ditolak untuk peran Anda.');

        return $next($request);
    }
}