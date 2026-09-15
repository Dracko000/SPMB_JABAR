<?php

namespace App\Http\Controllers;

use App\Models\AdmissionPath;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\Selection;
use App\Models\School;
use App\Services\QuotaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(private readonly QuotaService $quota) {}

    public function index(Request $request): Response
    {
        $period = \App\Models\AdmissionPeriod::where('is_active', true)->first();

        return Inertia::render('Admin/Dashboard', [
            'period' => $period,
            'quotas' => $period
                ? Quota::with('school', 'path')->whereHas('path', fn ($q) => $q->where('admission_period_id', $period->id))->get()
                : collect(),
            'selections' => Selection::with(['registration.student', 'school'])->orderBy('school_id')->get(),
            'registrations' => Registration::with(['student', 'path', 'choices.school'])
                ->where('status', '!=', 'draft')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(),
            'schools' => School::all(),
            'paths' => AdmissionPath::all(),
            'complaints' => \App\Models\Complaint::with('user')->orderByDesc('created_at')->get(),
        ]);
    }

    public function approveQuota(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'path_id' => ['required', 'exists:admission_paths,id'],
            'kuota' => ['required', 'integer', 'min:1'],
        ]);

        Quota::updateOrCreate(
            ['school_id' => $validated['school_id'], 'admission_path_id' => $validated['path_id']],
            ['kuota' => $validated['kuota']],
        );

        return back()->with('flash', ['success' => 'Kuota diperbarui.']);
    }

    public function runSelection(Request $request): \Illuminate\Http\RedirectResponse
    {
        // Phase-1 minimal: rank each school's verified registrations by age (youngest first — approximation)
        $schools = School::all();

        foreach ($schools as $school) {
            $verified = Registration::where('status', 'verified')
                ->whereHas('choices.school', fn ($q) => $q->where('schools.id', $school->id))
                ->with('student')
                ->get()
                ->sortBy(fn ($r) => $r->student?->tanggal_lahir);

            $rank = 1;
            foreach ($verified as $r) {
                Selection::updateOrCreate(
                    ['registration_id' => $r->id, 'school_id' => $school->id],
                    ['rank' => $rank++, 'status' => 'selected'],
                );
            }
        }

        return back()->with('flash', ['success' => 'Seleksi dijalankan (fase 1 — peringkat usia).']);
    }
}