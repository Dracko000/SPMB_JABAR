<?php

namespace App\Http\Controllers;

use App\Integration\Exceptions\StudentNotFoundException;
use App\Models\User;
use App\Services\AuthFlow;
use App\Services\TwoFactorAuthService;
use App\Support\Masking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(private readonly AuthFlow $auth) {}

    /**
     * Unified login for all roles.
     */
    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'identifier' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $identifier = $validated['identifier'];
        $password = $validated['password'];

        // Case 1: Staff Login (Email)
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            if (Auth::attempt(['email' => $identifier, 'password' => $password], $request->boolean('remember'))) {
                $request->session()->regenerate();
                $user = Auth::user();

                // Check for 2FA if user is admin
                if (in_array($user->role, ['admin_provinsi', 'admin_kabkota', 'superadmin']) && $user->google2fa_secret) {
                    return redirect()->route('auth.two-factor.verify');
                }

                return (match ($user->role) {
                    'admin_provinsi', 'admin_kabkota' => redirect()->route('admin.index'),
                    'superadmin' => redirect()->route('superadmin.index'),
                    'operator_sekolah', 'verifikator' => redirect()->route('verification.index'),
                    default => redirect()->route('dashboard.pendaftar'),
                })->with('flash', ['success' => 'Selamat datang, '.$user->name]);
            }

            return back()->withErrors(['identifier' => 'Email atau kata sandi salah.'])->withInput();
        }

        // Case 2: Student Login (NISN)
        if (strlen($identifier) === 10 && ctype_digit($identifier)) {
            if ($identifier === $password) {
                try {
                    $user = User::where('role', 'pendaftar')
                        ->whereHas('student', fn ($q) => $q->where('nisn', $identifier))
                        ->first();

                    if (! $user) {
                        return back()->withErrors(['identifier' => 'Akun pendaftar tidak ditemukan.'])->withInput();
                    }

                    Auth::login($user);
                    $request->session()->regenerate();

                    return redirect()->route('dashboard.pendaftar')->with('flash', ['success' => 'Selamat datang, '.$user->name]);
                } catch (\Exception $e) {
                    return back()->withErrors(['identifier' => 'Terjadi kesalahan saat login.'])->withInput();
                }
            }

            return back()->withErrors(['password' => 'Password tidak sesuai dengan NISN.'])->withInput();
        }

        return back()->withErrors(['identifier' => 'Format login tidak dikenali. Gunakan Email atau NISN.'])->withInput();
    }

    public function loginPage(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('landing');
    }

    // ---------------------------------------------------------------------
    // Legacy NISN → OTP flow (backend/README "alur inti" #1). Routes still
    // registered in routes/web.php; pages Auth/NisnLookup, OtpSend, OtpVerify.
    // ---------------------------------------------------------------------

    public function nisn(Request $request): Response
    {
        return Inertia::render('Auth/NisnLookup');
    }

    public function lookup(Request $request)
    {
        $validated = $request->validate([
            'nisn' => ['required', 'string', 'digits:10'],
        ]);

        try {
            $student = $this->auth->lookup($validated['nisn']);
        } catch (StudentNotFoundException $e) {
            return back()->withErrors(['nisn' => $e->getMessage()])->withInput();
        }

        return Inertia::render('Auth/OtpSend', [
            'nisn' => $student->nisn,
            'student' => [
                'nama' => $student->nama,
                'nik_masked' => Masking::nik($student->nik),
                'nisn_masked' => Masking::nisn($student->nisn),
                'tanggal_lahir' => $student->tanggalLahir?->format('d M Y'),
                'jenis_kelamin' => $student->jenisKelamin,
                'sekolah_asal' => $student->sekolahAsal,
            ],
        ]);
    }

    /**
     * Step 2 — send OTP. Uses phone from gateway data (mock: seeded).
     */
    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'nisn' => ['required', 'string', 'digits:10'],
        ]);

        try {
            $record = $this->auth->lookup($validated['nisn']);
            $token = $this->auth->sendOtp($record->nisn);
        } catch (StudentNotFoundException $e) {
            return back()->withErrors(['nisn' => $e->getMessage()])->withInput();
        }

        return Inertia::render('Auth/OtpVerify', [
            'nisn' => $validated['nisn'],
            'request_token' => $token,
            'otp_hint' => 'Kode OTP dikirim via SMS/log (fase mock).',
        ]);
    }

    /**
     * Step 3 — verify OTP, create session as pendaftar.
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'nisn' => ['required', 'string', 'digits:10'],
            'request_token' => ['required', 'string'],
            'code' => ['required', 'string', 'digits:6'],
        ]);

        try {
            $user = $this->auth->verifyOtp($validated['nisn'], $validated['code'], $validated['request_token']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['code' => $e->getMessage()])->withInput();
        }

        Auth::login($user);

        $request->session()->regenerate();

        return redirect()->route('dashboard.pendaftar')->with('flash', [
            'success' => 'Selamat datang, '.$user->name,
        ]);
    }

    public function showTwoFactorPage(): Response
    {
        return Inertia::render('Auth/TwoFactorVerify');
    }

    public function verifyTwoFactor(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = Auth::user();
        $service = app(TwoFactorAuthService::class);

        if ($service->verifyOtp($user->google2fa_secret, $request->code)) {
            $request->session()->put('2fa_verified', true);

            return redirect()->route('admin.index')->with('flash', ['success' => 'OTP Terverifikasi. Selamat datang!']);
        }

        return back()->withErrors(['code' => 'Kode OTP salah atau sudah kedaluwarsa.'])->withInput();
    }

    public function showTwoFactorSetup(): Response
    {
        $user = Auth::user();
        $service = app(TwoFactorAuthService::class);

        return Inertia::render('Auth/TwoFactorSetup', [
            'qr_code' => $service->getQrCodeUrl($user),
        ]);
    }

    public function enableTwoFactor(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = Auth::user();
        $service = app(TwoFactorAuthService::class);

        // Secret is generated and temporarily held in session or handled by service
        // For simplicity, we generate it and then verify it
        $secret = $service->generateSecret();

        if ($service->verifyOtp($secret, $request->code)) {
            $user->update(['google2fa_secret' => $secret]);

            return redirect()->route('admin.index')->with('flash', ['success' => '2FA berhasil diaktifkan!']);
        }

        return back()->withErrors(['code' => 'Kode verifikasi awal salah.'])->withInput();
    }
}
