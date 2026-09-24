<?php

namespace App\Services;

use App\Models\AdmissionPath;
use App\Models\Notification;
use App\Models\Quota;
use App\Models\Region;
use App\Models\Registration;
use App\Models\School;
use App\Models\User;

class DashboardService
{
    public function pendaftar(User $user): array
    {
        $registration = $user->registration
            ?->load(['path', 'choices.school.region', 'documents']);

        return [
            'registration' => $registration,
            'kpis' => [
                'status' => $registration?->status ?? 'none',
                'no_pendaftaran' => $registration?->no_pendaftaran,
                'dokumen' => $registration?->documents()->count() ?? 0,
                'verification' => [
                    'notes' => $registration?->verification_notes,
                    'kk' => $registration?->is_kk_verified,
                    'ijazah' => $registration?->is_ijazah_verified,
                    'alamat' => $registration?->is_alamat_verified,
                ],
            ],
            'notifications' => Notification::where('user_id', $user->id)
                ->orderByDesc('created_at')->limit(20)->get(),
            'notifications_unread' => Notification::where('user_id', $user->id)->whereNull('read_at')->count(),
        ];
    }

    public function sekolah(User $user): array
    {
        $schoolId = $user->school_id;

        $base = fn ($status) => Registration::where('status', $status)
            ->whereHas('choices', fn ($q) => $q->where('school_id', $schoolId));

        $total = $base('submitted')->count();
        $menunggu = Registration::whereIn('status', ['submitted', 'perbaikan'])
            ->whereHas('choices', fn ($q) => $q->where('school_id', $schoolId))
            ->count();
        $valid = $base('verified')->count();

        return [
            'registrations' => Registration::where('status', '!=', 'draft')
                ->whereHas('choices', fn ($q) => $q->where('school_id', $schoolId))
                ->with(['student', 'path', 'choices.school'])
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(),
            'kpis' => [
                'total' => $total,
                'menunggu' => $menunggu,
                'valid' => $valid,
            ],
        ];
    }

    public function kabkota(User $user): array
    {
        $regionId = $user->role_region_id;

        $registrations = Registration::where('status', '!=', 'draft')
            ->whereHas('choices.school', fn ($q) => $q->where('region_id', $regionId))
            ->with(['student', 'path', 'choices.school'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        // Aggregate data for Kab/Kota KPIs (PRD §25)
        $stats = [
            'total_pendaftar' => Registration::where('status', '!=', 'draft')
                ->whereHas('choices.school', fn ($q) => $q->where('region_id', $regionId))
                ->count(),
            'total_sekolah' => School::where('region_id', $regionId)->where('is_active', true)->count(),
            'per_school' => School::where('region_id', $regionId)
                ->withCount(['registrations' => fn ($q) => $q->where('status', '!=', 'draft')])
                ->get()
                ->map(fn ($school) => [
                    'name' => $school->name,
                    'pendaftar_count' => $school->registrations_count,
                ]),
            'per_path' => AdmissionPath::withCount(['registrations' => fn ($q) => $q->whereHas('choices.school', fn ($sq) => $sq->where('region_id', $regionId)),
            ])->get()->map(fn ($path) => [
                'name' => $path->name,
                'count' => $path->registrations_count,
            ]),
        ];

        return [
            'registrations' => $registrations,
            'kpis' => [
                'total' => $stats['total_pendaftar'],
                'menunggu' => $registrations->whereIn('status', ['submitted', 'perbaikan'])->count(),
                'valid' => $registrations->where('status', 'verified')->count(),
            ],
            'analytics' => $stats,
        ];
    }

    public function provinsi(): array
    {
        $registrations = Registration::where('status', '!=', 'draft')
            ->with(['student', 'path', 'choices.school.region'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        // Aggregate data for Provincial KPIs (PRD §25)
        $stats = [
            'total_pendaftar' => Registration::where('status', '!=', 'draft')->count(),
            'total_sekolah' => School::where('is_active', true)->count(),
            'total_kuota' => Quota::sum('kuota'),
            'terverifikasi' => Registration::where('status', 'verified')->count(),
            'per_region' => Region::withCount(['schools' => function ($q) {
                $q->where('is_active', true);
            }])->get()->map(function ($region) {
                return [
                    'name' => $region->name,
                    'school_count' => $region->schools_count,
                    'pendaftar_count' => Registration::whereHas('choices.school', fn ($q) => $q->where('region_id', $region->id))->count(),
                ];
            }),
            'per_path' => AdmissionPath::withCount('registrations')->get()->map(function ($path) {
                return [
                    'name' => $path->name,
                    'count' => $path->registrations_count,
                ];
            }),
        ];

        return [
            'registrations' => $registrations,
            'kpis' => [
                'total' => $stats['total_pendaftar'],
                'submitted' => $registrations->where('status', 'submitted')->count(),
                'verified' => $stats['terverifikasi'],
                'rejected' => Registration::where('status', 'rejected')->count(),
            ],
            'analytics' => $stats,
        ];
    }
}
