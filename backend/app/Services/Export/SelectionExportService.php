<?php

namespace App\Services\Export;

use App\Models\Selection;

class SelectionExportService
{
    /**
     * Generate a professional summary of selection results.
     * In a real production environment, this would integrate with
     * a PDF library like DomPDF or Browsershot.
     */
    public function generateSelectionReport($pathId = null, $regionId = null)
    {
        $results = Selection::with(['registration.student', 'school'])
            ->when($pathId, fn ($q) => $q->whereHas('registration', fn ($r) => $r->where('admission_path_id', $pathId)))
            ->when($regionId, fn ($q) => $q->whereHas('school', fn ($s) => $s->where('region_id', $regionId)))
            ->orderBy('id', 'asc')
            ->get();

        return [
            'total_selected' => $results->count(),
            'data' => $results->map(fn ($r) => [
                'nama' => $r->registration->student->nama,
                'sekolah' => $r->school->name,
                'skor' => $r->composite_score,
                'status' => $r->status,
            ]),
            'generated_at' => now()->toDateTimeString(),
        ];
    }
}
