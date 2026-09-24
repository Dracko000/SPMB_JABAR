<?php

namespace App\Http\Controllers;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Region;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dokumentasi sistem SPMB JABAR — panduan lengkap, jadwal, jalur &
 * persyaratan dokumen, serta kredensial akun demo untuk semua peran.
 *
 * Halaman ini publik dan read-only; semua rincian diambil dari database
 * yang sedang aktif agar dokumentasi selalu selaras dengan konfigurasi
 * berjalan (bukan hardcode yang mudah usang).
 */
class DocsController extends Controller
{
    public function index(): Response
    {
        $paths = AdmissionPath::with('requirements')
            ->orderBy('id')
            ->get()
            ->map(fn (AdmissionPath $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'description' => $p->description,
                'requirements' => $p->requirements->map(fn ($r) => [
                    'code' => $r->code,
                    'name' => $r->name,
                ])->values(),
            ]);

        $period = Cache::remember('docs_active_period', 3600, fn () => AdmissionPeriod::where('is_active', true)->latest('year')->first());

        $accounts = User::query()
            ->with('school:id,name')
            ->whereNotNull('email')
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'school_id', 'student_id'])
            ->map(fn (User $u) => [
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'school' => $u->school?->name,
            ]);

        return Inertia::render('Docs/Index', [
            'paths' => $paths,
            'period' => $period ? [
                'year' => $period->year,
                'registration_start' => $period->registration_start,
                'registration_end' => $period->registration_end,
            ] : null,
            'stats' => [
                'schools' => School::where('is_active', true)->count(),
                'regions' => Region::where('type', 'KABKOTA')->count(),
                'roles' => $accounts->pluck('role')->unique()->count(),
            ],
            'accounts' => $accounts,
        ]);
    }
}