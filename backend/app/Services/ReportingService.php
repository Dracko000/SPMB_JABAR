<?php

namespace App\Services;

use App\Models\AdmissionPeriod;
use App\Models\SelectionResult;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportingService
{
    /**
     * Export the final selection results to CSV.
     *
     * @param  array  $filters  [region_id, path_id]
     */
    public function exportSelectionCsv(array $filters = []): StreamedResponse
    {
        $filename = 'selection_results_'.now()->format('Ymd_His').'.csv';

        // Build query based on filters
        $query = SelectionResult::with(['registration.student', 'school'])
            ->whereHas('registration', function ($q) {
                $period = AdmissionPeriod::where('is_active', true)->first();
                $q->where('admission_period_id', $period?->id);
            });

        if (! empty($filters['region_id'])) {
            $query->whereHas('school', function ($q) {
                $q->where('region_id', $filters['region_id']);
            });
        }

        if (! empty($filters['path_id'])) {
            $query->whereHas('registration', function ($q) {
                $q->where('admission_path_id', $filters['path_id']);
            });
        }

        $results = $query->orderBy('rank', 'asc')->get();

        $headers = [
            'Rank', 'No Pendaftaran', 'Nama Siswa', 'NISN', 'Sekolah Tujuan',
            'Jalur', 'Skor Akhir', 'Keterangan',
        ];

        return Response::stream(function () use ($results, $headers) {
            $handle = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8
            fputcsv($handle, $headers);

            foreach ($results as $result) {
                fputcsv($handle, [
                    $result->rank,
                    $result->registration->no_pendaftaran,
                    $result->registration->student->nama,
                    $result->registration->student->nisn,
                    $result->school->name,
                    $result->registration->path->name,
                    number_format($result->score, 2),
                    $result->status, // 'accepted' or 'waiting'
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
