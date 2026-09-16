<?php

namespace App\Http\Controllers;

use App\Integration\Exceptions\StudentNotFoundException;
use App\Services\AuthFlow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(private readonly AuthFlow $auth) {}

    /**
     * Staff password login (admin / operator / verifikator). Pendaftar that
     * have no seeded password keep using the NISN → OTP flow.
     */
    public function staffLoginPage(): Response
    {
        return Inertia::render('Auth/StaffLogin');
    }

    public function staffLogin(Request $request): \Illuminate\Http\RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return back()->withErrors(['email' => 'Email atau kata sandi salah.'])->withInput();
        }

        $request->session()->regenerate();

        $user = $request->user();

        return (match ($user->role) {
            'admin_provinsi', 'admin_kabkota' => redirect()->route('admin.index'),
            'operator_sekolah', 'verifikator' => redirect()->route('verification.index'),
            default => redirect()->route('dashboard.pendaftar'),
        })->with('flash', ['success' => 'Selamat datang, '.$user->name]);
    }

    /**
     * Step 1 — NISN lookup. Renders confirmation screen with masked data,
     * or back with error when the gateway says not-found.
     */
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
            // Inertia back with flash on the form (no session-bound data)
            return back()->withErrors(['nisn' => $e->getMessage()])->withInput();
        }

        return Inertia::render('Auth/OtpSend', [
            'nisn' => $student->nisn,
            'student' => [
                'nama' => $student->nama,
                'nik_masked' => \App\Support\Masking::nik($student->nik),
                'nisn_masked' => \App\Support\Masking::nisn($student->nisn),
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

    public function logout(Request $request): \Illuminate\Http\RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('landing');
    }
}