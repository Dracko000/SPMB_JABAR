<?php

namespace App\Services;

use App\Models\AdmissionPath;
use App\Models\Quota;
use App\Models\Region;
use App\Models\Registration;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    /**
     * Export registrations to CSV.
     * Uses a StreamedResponse to handle large datasets without memory exhaustion.
     */
    public function exportRegistrationsCsv(array $filters = []): StreamedResponse
    {
        $fileName = 'report_pendaftar_'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(function () use ($filters) {
            $handle = fopen('php://output', 'w');

            // Header
            fputcsv($handle, [
                'No Pendaftaran', 'NISN', 'Nama Siswa', 'Jalur', 'Status', 'Sekolah Pilihan Utama', 'Tanggal Daftar',
            ]);

            $query = Registration::with(['student', 'path', 'choices.school'])
                ->where('status', '!=', 'draft');

            if (isset($filters['region_id'])) {
                $query->whereHas('choices.school', fn ($q) => $q->where('region_id', $filters['region_id']));
            }

            if (isset($filters['path_id'])) {
                $query->where('admission_path_id', $filters['path_id']);
            }

            // Use chunk to prevent memory overflow
            $query->chunk(100, function ($registrations) use ($handle) {
                foreach ($registrations as $reg) {
                    fputcsv($handle, [
                        $reg->no_pendaftaran,
                        $reg->student?->nisn,
                        $reg->student?->nama,
                        $reg->path?->name,
                        $reg->status,
                        $reg->choices->first()?->school?->name ?? 'N/A',
                        $reg->created_at->format('Y-m-d H:i'),
                    ]);
                }
            });

            fclose($handle);
        }, $fileName);
    }

    /**
     * Generate high-level aggregates for the provincial executive summary.
     */
    public function generateProvincialSummary(): array
    {
        $totalPendaftar = Registration::where('status', '!=', 'draft')->count();
        $verifiedCount = Registration::where('status', 'verified')->count();
        $totalQuota = Quota::sum('kuota');
        $totalFilled = Quota::sum('terisi');

        $pathStats = AdmissionPath::withCount('registrations as count')
            ->get()
            ->map(fn ($p) => [
                'name' => $p->name,
                'count' => $p->count,
                'percentage' => $totalPendaftar > 0 ? round(($p->count / $totalPendaftar) * 100, 1) : 0,
            ]);

        $regionStats = Region::where('type', 'KABKOTA')
            ->get()
            ->map(function ($r) {
                $pendaftar = Registration::whereHas('choices.school', fn ($q) => $q->where('region_id', $r->id))->count();
                $quota = Quota::whereHas('school', fn ($q) => $q->where('region_id', $r->id))->sum('kuota');

                return [
                    'region' => $r->name,
                    'pendaftar' => $pendaftar,
                    'quota' => $quota,
                    'saturation' => $quota > 0 ? round(($pendaftar / $quota) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('pendaftar')
            ->values();

        return [
            'summary' => [
                'total_pendaftar' => $totalPendaftar,
                'verified_rate' => $totalPendaftar > 0 ? round(($verifiedCount / $totalPendaftar) * 100, 1) : 0,
                'quota_saturation' => $totalQuota > 0 ? round(($totalFilled / $totalQuota) * 100, 1) : 0,
                'total_quota' => $totalQuota,
                'total_filled' => $totalFilled,
                'generated_at' => now()->toDateTimeString(),
            ],
            'path_breakdown' => $pathStats,
            'regional_breakdown' => $regionStats,
        ];
    }
}
