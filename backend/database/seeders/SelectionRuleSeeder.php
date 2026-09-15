<?php

namespace Database\Seeders;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\SelectionRule;
use Illuminate\Database\Seeder;

class SelectionRuleSeeder extends Seeder
{
    public function run(): void
    {
        $period = AdmissionPeriod::where('is_active', true)->first() ?? AdmissionPeriod::firstOrFail();

        $rules = [
            'zonasi'       => ['score_weight' => 0.30, 'distance_weight' => 0.70, 'tie_break' => 'age_youngest'],
            'prestasi'     => ['score_weight' => 0.90, 'distance_weight' => 0.10, 'tie_break' => 'date_submitted_asc'],
            'afirmasi'     => ['score_weight' => 0.50, 'distance_weight' => 0.50, 'tie_break' => 'date_submitted_asc'],
            'perpindahan'  => ['score_weight' => 0.60, 'distance_weight' => 0.40, 'tie_break' => 'date_submitted_asc'],
        ];

        foreach ($rules as $code => $cfg) {
            $path = AdmissionPath::where('code', $code)->first();
            if (! $path) {
                continue;
            }

            SelectionRule::updateOrCreate(
                ['admission_period_id' => $period->id, 'admission_path_id' => $path->id],
                array_merge($cfg, ['is_active' => true, 'created_by' => null]),
            );
        }
    }
}