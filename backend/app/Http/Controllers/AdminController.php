<?php

namespace App\Http\Controllers;

use App\Engines\SelectionEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\AuditLog;
use App\Models\Complaint;
use App\Models\Quota;
use App\Models\QuotaRequest;
use App\Models\Region;
use App\Models\Registration;
use App\Models\School;
use App\Models\Selection;
use App\Models\SelectionResult;
use App\Services\Export\SelectionExportService;
use App\Services\QuotaService;
use App\Services\ReportService;
use App\Services\SelectionRuleManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    public function __construct(
        private readonly QuotaService $quota,
        private readonly SelectionRuleManager $rules,
        private readonly SelectionEngine $engine,
        private readonly ReportService $reports,
        private readonly SelectionExportService $export,
    ) {}

    public function exportResults(Request $request): StreamedResponse
    {
        // Return the CSV export for raw data
        return $this->reports->exportSelectionCsv($request->only(['region_id', 'path_id']));
    }

    public function exportPdfResults(Request $request)
    {
        $pathId = $request->query('path_id');
        $regionId = $request->query('region_id');

        $data = $this->export->generateSelectionReport($pathId, $regionId);

        $path = AdmissionPath::find($pathId);
        $region = Region::find($regionId);

        return Inertia::render('Admin/SelectionReport', [
            'reportData' => $data,
            'pathName' => $path?->name ?? 'Semua Jalur',
            'regionName' => $region?->name ?? 'Semua Wilayah',
        ]);
    }

    public function export(Request $request)
    {
        $filters = [
            'region_id' => $request->query('region_id'),
            'path_id' => $request->query('path_id'),
        ];

        return $this->reports->exportRegistrationsCsv($filters);
    }

    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Dashboard', $this->indexProps($request));
    }

    /** Reusable prop bundle for the Dashboard, shared by index + dry-run preview. */
    private function indexProps(Request $request): array
    {
        $period = Cache::remember('active_period', 3600, fn () => AdmissionPeriod::where('is_active', true)->first()
        );

        // KPI Aggregates
        $stats = [
            'total_pendaftar' => Registration::where('status', '!=', 'draft')->count(),
            'verified_count' => Registration::where('status', 'verified')->count(),
            'rejected_count' => Registration::where('status', 'ditolak')->count(),
            'revision_count' => Registration::where('status', 'perbaikan')->count(),
            'total_quota' => Quota::sum('kuota'),
            'total_terisi' => Quota::sum('terisi'),
        ];

        // Funnel Data
        $funnel = [
            ['stage' => 'Total Pendaftar', 'count' => $stats['total_pendaftar']],
            ['stage' => 'Submitted', 'count' => Registration::whereIn('status', ['submitted', 'verified', 'ditolak', 'perbaikan'])->count()],
            ['stage' => 'Terverifikasi', 'count' => $stats['verified_count']],
            ['stage' => 'Terseleksi', 'count' => Selection::count()],
        ];

        $pathDistribution = AdmissionPath::where('admission_period_id', $period?->id)
            ->withCount('registrations as count')
            ->get()
            ->map(fn ($p) => [
                'name' => $p->name,
                'count' => $p->count,
                'percentage' => $stats['total_pendaftar'] > 0
                    ? round(($p->count / $stats['total_pendaftar']) * 100, 1)
                    : 0,
            ]);

        // Advanced Analytics: Verification Bottlenecks
        $verificationBottlenecks = School::withCount(['registrations' => fn ($q) => $q->where('status', 'submitted')])
            ->get()
            ->filter(fn ($s) => $s->registrations_count > 0)
            ->map(fn ($s) => [
                'school_name' => $s->name,
                'pending_count' => $s->registrations_count,
                'avg_verification_time' => Registration::whereHas('choices', fn ($q) => $q->where('school_id', $s->id))
                    ->where('status', 'verified')
                    ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours')
                    ->first()->avg_hours ?? 0,
            ])
            ->sortByDesc('pending_count')
            ->take(10)
            ->values();

        // Advanced Analytics: Regional Demand & Saturation
        $regionalDemand = Region::where('type', 'KABKOTA')
            ->withCount(['schools' => fn ($q) => $q->whereHas('quotas')])
            ->get()
            ->map(fn ($r) => [
                'region_name' => $r->name,
                'pendaftar_count' => Registration::whereHas('choices.school', fn ($q) => $q->where('region_id', $r->id))->count(),
                'quota_count' => Quota::whereHas('school', fn ($q) => $q->where('region_id', $r->id))->sum('kuota'),
                'saturation' => 0, // Calculated in JS or here
            ])
            ->map(function ($item) {
                $item['saturation'] = $item['quota_count'] > 0
                    ? round(($item['pendaftar_count'] / $item['quota_count']) * 100, 1)
                    : 0;

                return $item;
            })
            ->sortByDesc('pendaftar_count')
            ->values();

        return [
            'period' => $period,
            'stats' => $stats,
            'funnel' => $funnel,
            'pathDistribution' => $pathDistribution,
            'verificationBottlenecks' => $verificationBottlenecks,
            'regionalDemand' => $regionalDemand,
            'quotas' => $period
                ? Cache::remember("quotas_period_{$period->id}", 3600, fn () => Quota::with('school', 'path')->whereHas('path', fn ($q) => $q->where('admission_period_id', $period->id))->get()
                )
                : collect(),
            'quotaRequests' => QuotaRequest::with(['school', 'path'])
                ->where('status', 'pending')
                ->latest()
                ->get(),
            'selections' => Selection::with(['registration.student', 'school'])->orderBy('school_id')->get(),
            'registrations' => Registration::with(['student', 'path', 'choices.school'])
                ->where('status', '!=', 'draft')
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(),
            'schools' => Cache::remember('all_schools', 86400, fn () => School::all()),
            'paths' => Cache::remember('all_paths', 86400, fn () => AdmissionPath::all()),
            'complaints' => Complaint::with('user')->orderByDesc('created_at')->get(),
            'selectionRules' => $period ? $this->rules->all($period) : collect(),
            'selectionResults' => SelectionResult::with(['registration.student', 'school'])
                ->whereHas('registration', fn ($q) => $q->where('admission_period_id', $period?->id))
                ->latest('id')
                ->limit(50)
                ->get(),
            'auditLogs' => AuditLog::with('user')->latest()->limit(100)->get(),
        ];
    }

    public function processQuotaRequest(Request $request): RedirectResponse
    {
        $quotaRequest = QuotaRequest::findOrFail($request->quota_request_id);

        $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $notes = trim($request->input('notes', ''));

        if ($request->status === 'approved') {
            $period = AdmissionPeriod::where('is_active', true)->first();
            if (! $period) {
                return back()->withErrors(['error' => 'Tidak ada periode aktif untuk menghitung distribusi kuota.']);
            }

            $distributions = \DB::table('global_quota_distribution')
                ->where('admission_period_id', $period->id)
                ->get();

            if ($distributions->isEmpty()) {
                return back()->withErrors(['error' => 'Konfigurasi Distribusi Global belum diatur. Silakan atur di tab Periode.']);
            }

            foreach ($distributions as $dist) {
                $allocated = round(($dist->percentage / 100) * $quotaRequest->requested_kuota);

                Quota::updateOrCreate(
                    ['school_id' => $quotaRequest->school_id, 'admission_path_id' => $dist->admission_path_id],
                    ['kuota' => (int) $allocated]
                );
            }
        }

        $quotaRequest->update([
            'status' => $request->status,
            'notes' => $notes,
            'approved_by' => $request->user()->id,
        ]);

        return back()->with('flash', [
            'success' => $request->status === 'approved'
                ? 'Pengajuan kuota disetujui dan didistribusikan secara global.'
                : 'Pengajuan kuota ditolak.',
        ]);
    }

    public function updateGlobalDistribution(Request $request): RedirectResponse
    {
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(403, 'Belum ada periode pendaftaran aktif.');

        $validated = $request->validate([
            'distribution' => ['required', 'array'],
            'distribution.*.path_id' => ['required', 'exists:admission_paths,id'],
            'distribution.*.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $totalPercentage = array_sum(array_column($validated['distribution'], 'percentage'));
        if ($totalPercentage != 100) {
            return back()->withErrors(['distribution' => 'Total persentase harus tepat 100%.']);
        }

        foreach ($validated['distribution'] as $item) {
            \DB::table('global_quota_distribution')->updateOrInsert(
                ['admission_period_id' => $period->id, 'admission_path_id' => $item['path_id']],
                ['percentage' => (float) $item['percentage']]
            );
        }

        return back()->with('flash', ['success' => 'Konfigurasi Distribusi Global berhasil disimpan.']);
    }

    public function approveQuota(Request $request): RedirectResponse
    {
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(422, 'Belum ada periode pendaftaran aktif.');

        $validated = $request->validate([
            'school_id' => ['required', 'exists:schools,id'],
            'path_id' => ['required', 'exists:admission_paths,id', fn ($attr, $val, $fail) => ! AdmissionPath::where('id', $val)->where('admission_period_id', $period->id)->exists()
                ? $fail('Jalur yang dipilih tidak termasuk dalam periode aktif saat ini.')
                : null],
            'kuota' => ['required', 'integer', 'min:1'],
        ]);

        $quota = Quota::updateOrCreate(
            ['school_id' => $validated['school_id'], 'admission_path_id' => $validated['path_id']],
            ['kuota' => (int) $validated['kuota']],
        );

        $quota->auditUpdate(['kuota' => (int) $validated['kuota']]);

        return back()->with('flash', ['success' => 'Kuota diperbarui.']);
    }

    public function saveSelectionRule(Request $request): RedirectResponse
    {
        $period = AdmissionPeriod::where('is_active', true)->first()
            ?? abort(422, 'Belum ada periode pendaftaran aktif.');

        $validated = $request->validate([
            'path_id' => ['required', 'exists:admission_paths,id', fn ($attr, $val, $fail) => ! AdmissionPath::where('id', $val)->where('admission_period_id', $period->id)->exists()
                ? $fail('Jalur yang dipilih tidak termasuk dalam periode aktif saat ini.')
                : null],
            'score_weight' => [
                'required', 'numeric', 'min:0', 'max:1',
                fn ($attribute, $value, $fail) => ((float) $value + (float) request('distance_weight', 0)) > 1
                    ? $fail('Bobot skor + jarak tidak boleh melebihi 1.')
                    : null,
            ],
            'distance_weight' => ['required', 'numeric', 'min:0', 'max:1'],
            'tie_break' => ['required', 'string', 'in:date_submitted_asc,age_youngest'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $rule = $this->rules->upsert($period, (int) $validated['path_id'], $request->user()->id, $validated);

        if ($rule) {
            $rule->auditUpdate($validated);
        }

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

    public function updatePathPeriod(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'path_id' => ['required', 'exists:admission_paths,id'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
        ]);

        AdmissionPath::where('id', $validated['path_id'])->update([
            'registration_start' => $validated['registration_start'],
            'registration_end' => $validated['registration_end'],
        ]);

        return back()->with('flash', ['success' => 'Jadwal jalur pendaftaran berhasil diperbarui.']);
    }

    public function exportProvincialSummary(Request $request)
    {
        $data = $this->reports->generateProvincialSummary();

        // Return as a professional printable HTML page that the user can 'Print to PDF'
        // This is more flexible and visually superior than raw FPDF for complex layouts
        return Inertia::render('Admin/ProvincialSummary', [
            'data' => $data,
            'generated_at' => now()->format('d F Y, H:i'),
        ]);
    }
}
