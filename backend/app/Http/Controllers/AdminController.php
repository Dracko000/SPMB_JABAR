<?php

namespace App\Http\Controllers;

use App\Engines\SelectionEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\School;
use App\Models\Selection;
use App\Models\SelectionResult;
use App\Services\QuotaService;
use App\Services\SelectionRuleManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct(
        private readonly QuotaService $quota,
        private readonly SelectionRuleManager $rules,
        private readonly SelectionEngine $engine,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Dashboard', $this->indexProps($request));
    }

    /** Reusable prop bundle for the Dashboard, shared by index + dry-run preview. */
    private function indexProps(Request $request): array
    {
        $period = AdmissionPeriod::where('is_active', true)->first();

        return [
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
            'selectionRules' => $period ? $this->rules->all($period) : collect(),
            'selectionResults' => SelectionResult::with(['registration.student', 'school'])->latest('id')->limit(50)->get(),
        ];
    }

    public function approveQuota(Request $request): RedirectResponse
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

    public function saveSelectionRule(Request $request): RedirectResponse
    {
        // The path must belong to the ACTIVE period — validated in one rule so a
        // path from another period cannot be upserted. No active period → 422.
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(422, 'Belum ada periode pendaftaran aktif.');

        $validated = $request->validate([
            'path_id' => ['required', 'exists:admission_paths,id,admission_period_id,'.$period->id],
            'score_weight' => ['required', 'numeric', 'min:0', 'max:1'],
            'distance_weight' => ['required', 'numeric', 'min:0', 'max:1'],
            'tie_break' => ['required', 'string', 'in:date_submitted_asc,age_youngest'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->rules->upsert($period, (int) $validated['path_id'], $request->user()->id, $validated);

        return back()->with('flash', ['success' => 'Aturan seleksi disimpan.']);
    }

    public function dryRunSelection(Request $request): Response
    {
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(403, 'Belum ada periode pendaftaran aktif.');

        $preview = $this->engine->dryRun($period);

        return Inertia::render('Admin/Dashboard', $this->indexProps($request) + [
            'selectionPreview' => $preview,
            'selectionViewed' => true,
        ]);
    }

    public function publishSelection(Request $request): RedirectResponse
    {
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(403, 'Belum ada periode pendaftaran aktif.');

        $this->engine->publish($period);

        return back()->with('flash', ['success' => 'Hasil seleksi dipublikasikan.']);
    }
}