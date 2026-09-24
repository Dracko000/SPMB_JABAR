<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TwoFactorMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Only enforce 2FA for admin roles (same scope as the login redirect
        // in AuthController) and only when they have enrolled a secret.
        $needsTwoFactor = in_array($user->role, ['admin_provinsi', 'admin_kabkota'], true)
            && ! empty($user->google2fa_secret);

        if ($needsTwoFactor && ! $request->session()->get('2fa_verified')) {
            // Allow the 2FA verification page itself, logout, and the Inertia
            // data endpoint the page needs to render.
            if (! $request->is('auth/two-factor*') && ! $request->is('logout')) {
                return redirect()->route('auth.two-factor.verify');
            }
        }

        return $next($request);
    }
}
