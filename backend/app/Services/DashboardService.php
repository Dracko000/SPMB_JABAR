<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\User;

class DashboardService
{
    public function pendaftar(User $user): array
    {
        $registration = $user->registration
            ?->load(['path', 'choices.school.region', 'documents', 'verifications']);

        return [
            'registration' => $registration,
            'kpis' => [
                'status' => $registration?->status ?? 'none',
                'no_pendaftaran' => $registration?->no_pendaftaran,
                'dokumen' => $registration?->documents()->count() ?? 0,
            ],
            'notifications' => \App\Models\Notification::where('user_id', $user->id)
                ->orderByDesc('created_at')->limit(20)->get(),
            'notifications_unread' => \App\Models\Notification::where('user_id', $user->id)->whereNull('read_at')->count(),
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
            ->get();

        return [
            'registrations' => $registrations,
            'kpis' => [
                'total' => $registrations->count(),
                'menunggu' => $registrations->whereIn('status', ['submitted', 'perbaikan'])->count(),
                'valid' => $registrations->where('status', 'verified')->count(),
            ],
        ];
    }

    public function provinsi(): array
    {
        $registrations = Registration::where('status', '!=', 'draft')
            ->with(['student', 'path', 'choices.school.region'])
            ->orderByDesc('created_at')
            ->get();

        return [
            'registrations' => $registrations,
            'kpis' => [
                'total' => $registrations->count(),
                'submitted' => $registrations->where('status', 'submitted')->count(),
                'verified' => $registrations->where('status', 'verified')->count(),
                'rejected' => $registrations->where('status', 'rejected')->count(),
            ],
        ];
    }
}