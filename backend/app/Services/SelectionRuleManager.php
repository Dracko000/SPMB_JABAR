<?php

namespace App\Services;

use App\Models\AdmissionPeriod;
use App\Models\SelectionRule;
use App\Support\Audit;
use Illuminate\Support\Collection;

/**
 * Admin (provinsi) CRUD over per-path selection rules. Validation happens in
 * the controller; this manager is pure persistence + audit.
 */
final class SelectionRuleManager
{
    public function all(AdmissionPeriod $period): Collection
    {
        return SelectionRule::with('path')
            ->where('admission_period_id', $period->id)
            ->orderBy('admission_path_id')
            ->get();
    }

    public function upsert(AdmissionPeriod $period, int $pathId, int $actorId, array $validated): SelectionRule
    {
        $rule = SelectionRule::updateOrCreate(
            ['admission_period_id' => $period->id, 'admission_path_id' => $pathId],
            array_merge($validated, ['is_active' => $validated['is_active'] ?? true, 'created_by' => $actorId]),
        );

        Audit::log('selection.rule_updated', [
            'rule_id' => $rule->id,
            'path_id' => $pathId,
            'weights' => [$validated['score_weight'], $validated['distance_weight']],
        ]);

        return $rule;
    }
}