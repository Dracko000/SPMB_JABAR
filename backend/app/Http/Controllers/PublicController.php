<?php

namespace App\Http\Controllers;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\PublicDownload;
use App\Models\Quota;
use App\Models\Region;
use App\Models\School;
use App\Models\SelectionResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    /**
     * Show public information about schools, paths, and quotas.
     */
    public function info(): Response
    {
        $paths = Cache::remember('public_active_paths', 3600, fn () => AdmissionPath::where('is_active', true)->get()
        );

        $schools = Cache::remember('public_active_schools', 3600, fn () => School::with(['quotas' => function ($q) {
            $q->whereHas('path', fn ($p) => $p->where('is_active', true));
        }])->where('is_active', true)->orderBy('name')->get()
        );

        $period = Cache::remember('public_active_period', 3600, fn () => AdmissionPeriod::where('is_active', true)->latest('year')->first()
        );

        $stats = [
            'schools' => $schools->count(),
            'paths' => $paths->count(),
            'kuota' => Quota::whereHas('school', fn ($q) => $q->where('is_active', true))
                ->whereHas('path', fn ($q) => $q->where('is_active', true))
                ->sum('kuota'),
        ];

        return Inertia::render('Landing', [
            'paths' => $paths,
            'schools' => $schools,
            'period' => $period ? [
                'year' => $period->year,
                'registration_start' => $period->registration_start,
                'registration_end' => $period->registration_end,
            ] : null,
            'stats' => $stats,
        ]);
    }

    /**
     * Public search for selection results by Registration Number or NISN.
     */
    public function checkResult(Request $request): Response
    {
        $identifier = $request->input('no_pendaftaran');

        if (! $identifier) {
            return Inertia::render('Public/Announcement', [
                'search' => '',
                'result' => null,
                'error' => null,
            ]);
        }

        $result = SelectionResult::with(['registration.student', 'school', 'registration.path'])
            ->whereHas('registration', function ($q) use ($identifier) {
                $q->where('no_pendaftaran', $identifier)
                    ->orWhereHas('student', fn ($sq) => $sq->where('nisn', $identifier));
            })
            ->first();

        if (! $result) {
            return Inertia::render('Public/Announcement', [
                'search' => $identifier,
                'result' => null,
                'error' => 'Data pendaftaran tidak ditemukan. Pastikan Nomor Pendaftaran atau NISN benar.',
            ]);
        }

        // Mask the student name for privacy (e.g., "Budi Santoso" -> "Budi S***")
        $studentName = $result->registration->student->nama;
        $maskedName = strlen($studentName) > 5
            ? substr($studentName, 0, 5).'...'
            : $studentName;

        // Mask the identifier (NISN/Registration No) to prevent harvest
        $identifierMasked = strlen($identifier) > 6
            ? substr($identifier, 0, 3).str_repeat('*', 4).substr($identifier, -3)
            : '******';

        return Inertia::render('Public/Announcement', [
            'search' => $identifier,
            'result' => [
                'name' => $maskedName,
                'identifier' => $identifierMasked,
                'school' => $result->school->name,
                'path' => $result->registration->path->name,
                'status' => $result->status,
                'rank' => $result->rank,
            ],
            'error' => null,
        ]);
    }

    /**
     * Public School Directory (Data Center)
     */
    public function directory(Request $request): Response
    {
        $regions = Cache::remember('public_regions_kabkota', 86400, fn () => Region::where('type', 'KABKOTA')->orderBy('name')->get()
        );

        $regionId = $request->query('region_id');
        $search = $request->query('search');
        $page = $request->query('page', 1);

        // Cache key based on filters to avoid collisions
        $cacheKey = "public_directory_r{$regionId}_s".md5($search)."_p{$page}";

        $schools = Cache::remember($cacheKey, 3600, function () use ($regionId, $search) {
            $query = School::query()
                ->with(['region', 'quotas.path'])
                ->where('is_active', true);

            if ($regionId) {
                $query->where('region_id', $regionId);
            }

            if ($search) {
                $query->where('name', 'like', '%'.$search.'%');
            }

            return $query->orderBy('name')->paginate(20)->withQueryString();
        });

        return Inertia::render('Public/Directory', [
            'regions' => $regions,
            'schools' => $schools,
            'filters' => $request->only(['region_id', 'search']),
        ]);
    }

    /**
     * List of official public downloads.
     */
    public function downloads(): Response
    {
        $files = Cache::remember('public_downloads_list', 3600, fn () => PublicDownload::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get()
        );

        return Inertia::render('Public/Downloads', [
            'files' => $files,
        ]);
    }
}
