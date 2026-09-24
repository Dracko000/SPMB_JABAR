<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SuperadminService;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panel Super Admin (§ superadmin):
 *  - membuat akun Admin Provinsi,
 *  - reset autentikasi dua faktor (2FA) akun admin,
 *  - memberi / mencabut hak "verifikasi global" — acc SELURUH pendaftar
 *    di semua sekolah (lintas scope operator).
 */
class SuperadminController extends Controller
{
    public function __construct(private readonly SuperadminService $svc) {}

    public function index(): Response
    {
        return Inertia::render('Superadmin/Dashboard', $this->svc->overview());
    }

    /** Buat akun Admin Provinsi baru. */
    public function storeAdmin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'region_id' => ['nullable', 'exists:regions,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // cast 'hashed' meng-hash otomatis
            'role' => 'admin_provinsi',
            'role_region_id' => $validated['region_id'] ?? null,
        ]);

        Audit::log('superadmin.admin.created', [
            'admin_id' => $user->id,
            'admin_email' => $user->email,
            'by' => $request->user()->email,
        ], $user);

        return redirect()->route('superadmin.index')->with('flash', [
            'success' => "Akun Admin Provinsi {$user->name} berhasil dibuat.",
        ]);
    }

    /** Reset 2FA: hapus secret Google Authenticator agar admin bisa masuk lagi. */
    public function resetTwoFactor(Request $request, User $user): RedirectResponse
    {
        if (! in_array($user->role, ['admin_provinsi', 'admin_kabkota', 'superadmin'], true)) {
            return back()->withErrors(['twofa' => 'User ini bukan akun admin; 2FA tidak relevan.']);
        }

        if ($user->id === $request->user()->id) {
            return back()->withErrors(['twofa' => 'Gunakan panel 2FA di akun Anda sendiri untuk reset milik sendiri.']);
        }

        $user->update(['google2fa_secret' => null]);

        Audit::log('superadmin.twofa.reset', [
            'target_id' => $user->id,
            'target_email' => $user->email,
            'by' => $request->user()->email,
        ], $user);

        return redirect()->route('superadmin.index')->with('flash', [
            'success' => "2FA {$user->name} berhasil di-reset. Ia dapat login tanpa kode OTP Authenticator.",
        ]);
    }

    /** Beri / cabut hak verifikasi global (acc semua pendaftar semua sekolah). */
    public function toggleVerificationRight(Request $request, User $user): RedirectResponse
    {
        // Hak verifikasi global relevan untuk peran staf penyelenggara,
        // bukan untuk superadmin (sudah inheren) atau calon siswa.
        if (! in_array($user->role, ['admin_provinsi', 'admin_kabkota', 'verifikator', 'operator_sekolah'], true)) {
            return back()->withErrors(['verification' => 'Peran user ini tidak dapat diberi hak verifikasi global.']);
        }

        $next = ! (bool) $user->can_verify_all;

        $user->update(['can_verify_all' => $next]);

        Audit::log($next ? 'superadmin.verify.global.granted' : 'superadmin.verify.global.revoked', [
            'target_id' => $user->id,
            'target_email' => $user->email,
            'by' => $request->user()->email,
        ], $user);

        return redirect()->route('superadmin.index')->with('flash', [
            'success' => $next
                ? "{$user->name} kini dapat acc/menilai SEMUA pendaftar di semua sekolah."
                : "Hak verifikasi global {$user->name} dicabut — kembali ke scope sekolahnya saja.",
        ]);
    }
}