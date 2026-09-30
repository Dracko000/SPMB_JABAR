<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers — the part of "protecting the app from the console" that is
 * actually enforced by the browser rather than by JavaScript the page controls.
 *
 * Why this matters: a page can try to hide its console all day long, but it
 * cannot stop the browser from honouring these headers. In particular:
 *
 *  - Content-Security-Policy with a nonce stops injected inline scripts (XSS)
 *    from executing, and stops the app from being framed by another site
 *    (clickjacking) via frame-ancestors.
 *  - X-Content-Type-Options: nosniff stops the browser from re-interpreting
 *    responses (e.g. a .txt treated as HTML).
 *  - Referrer-Policy keeps NISN-bearing URLs out of the Referer header when
 *    leaving the site.
 *  - Permissions-Policy disables camera/microphone/geolocation etc. — the app
 *    never needs them, and an injected script should not get them either.
 *
 * The nonce is generated per response and threaded into the Vite tag helper,
 * so the strict policy still works with hashed assets.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // Fresh nonce per response — never reuse across responses.
        $nonce = base64_encode(random_bytes(16));

        Vite::useCspNonce($nonce);

        $response = $next($request);

        $response->headers->set('Content-Security-Policy', $this->csp($nonce, $request));
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');

        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }

    private function csp(string $nonce, Request $request): string
    {
        $relaxed = $this->relaxed();

        // Dev server (npm run dev) needs ws:/wss: + localhost for HMR.
        $connectSrc = $relaxed
            ? "'self' ws: wss: http://localhost:* http://127.0.0.1:*"
            : "'self'";

        $directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            // Inertia's page payload is a <script type="application/json"> data
            // block, not executable JS, so the app only needs the nonce plus
            // same-origin scripts.
            "script-src 'self' 'nonce-{$nonce}'",
            // Vite injects a <style> tag; Tailwind is bundled, so 'unsafe-inline'
            // is only needed for the dev server. Keep it out in production.
            "style-src 'self' 'nonce-{$nonce}'".($relaxed ? " 'unsafe-inline'" : ''),
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src {$connectSrc}",
            "manifest-src 'self'",
        ];

        return implode('; ', $directives);
    }

    private function relaxed(): bool
    {
        return (bool) config('security.csp.relaxed', false);
    }
}
