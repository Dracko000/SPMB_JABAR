<?php

namespace App\Engines;

use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\SelectionResult;
use App\Support\Audit;
use App\Support\CompositeScore;
use App\Support\NotificationBus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Configurable selection engine (PRD §13 secret): per-path rules → per-school
 * ranking → quota stop → results. Dry-run computes without persisting; publish
 * recomputes idempotently (fresh run_id) and notifies affected pendaftar.
 *
 * Students are processed by best-candidate score (desc, created_at asc on tie);
 * choices walked priority-asc until the first school with a remaining seat.
 */
final class SelectionEngine
{
    public function __construct(private readonly NotificationBus $notifications) {}

    public function dryRun(AdmissionPeriod $period): array
    {
        return $this->groupPreview($this->compute($period));
    }

    public function publish(AdmissionPeriod $period): array
    {
        $runId = (string) Str::uuid();

        // Idempotent: prior results for this period (across every path) are
        // replaced by one fresh run in the same transaction.
        $rows = DB::transaction(function () use ($period, $runId) {
            $registrationIds = Registration::where('admission_period_id', $period->id)->pluck('id');
            SelectionResult::whereIn('registration_id', $registrationIds)->delete();

            return $this->compute($period, persist: true, runId: $runId);
        });

        foreach ($rows as $row) {
            if ($row['status'] === 'selected') {
                $this->notifications->dispatch('selection.published', $row['registration_id'], $row);
            }
        }
        Audit::log('selection.published', ['period_id' => $period->id, 'results' => count($rows)]);

        return $this->groupPreview($rows);
    }

    private function compute(AdmissionPeriod $period, bool $persist = false, ?string $runId = null): array
    {
        $out = [];
        $assignedStudents = []; // student_id → school_id, across paths: one school per student
        $selectedPairs = [];    // "registration_id:school_id" of the rows actually selected

        // Per-path (verified registrations only); a path with no active rule
        // contributes nothing. Paths are processed in BabyJubJub order (zonasi
        // → prestasi → afirmasi → perpindahan), which is the path-priority
        // order: the first path to award the student a seat wins, so later
        // paths demote the student's row to not_selected (one school per
        // student).
        $paths = $period->paths()->orderBy('id')->with(['rules' => fn ($q) => $q->where('is_active', true)])->get();

        foreach ($paths as $path) {
            $rule = $path->rules->first();
            if (! $rule) {
                continue;
            }

            $remaining = Quota::where('admission_path_id', $path->id)
                ->pluck('kuota', 'school_id')
                ->map(fn ($q) => (int) $q)
                ->toArray();

            $regs = Registration::where('status', 'verified')
                ->where('admission_period_id', $period->id)
                ->where('admission_path_id', $path->id)
                ->with(['student'])
                ->orderBy('created_at')
                ->get();

            // Candidate pairs: every (registration, choice) with its score.
            $cands = [];
            foreach ($regs as $reg) {
                foreach ($reg->choices as $choice) {
                    $score = CompositeScore::compute(
                        (float) ($reg->student?->nilai_prestasi ?? 0),
                        (float) ($reg->student?->jarak_domisili_km ?? 0),
                        (float) $rule->score_weight,
                        (float) $rule->distance_weight,
                    );
                    $cands[$reg->id][] = [
                        'registration_id' => (int) $reg->id,
                        'student_id' => (int) $reg->student_id,
                        'school_id' => (int) $choice->school_id,
                        'priority' => (int) $choice->priority,
                        'score' => $score,
                        'created_at' => $reg->created_at,
                        'nama' => $reg->student?->nama,
                    ];
                }
            }

            // Students by best candidate score desc; tie → created_at asc.
            $studentIds = collect($cands)
                ->map(fn ($list) => collect($list)->max('score'))
                ->sortBy(function ($score, $id) use ($cands) {
                    return [-$score, $cands[$id][0]['created_at']->timestamp];
                })
                ->keys();

            $schoolRanks = [];

            foreach ($studentIds as $studentId) {
                $choices = collect($cands[$studentId])->sortBy('priority');

                // A student already seated by an earlier (higher-priority)
                // path cannot take a second school; their remaining choice
                // pairs become not_selected rows below.
                if (isset($assignedStudents[$cands[$studentId][0]['student_id']])) {
                    continue;
                }

                $assigned = null;
                foreach ($choices as $c) {
                    if (($remaining[$c['school_id']] ?? 0) > 0) {
                        $remaining[$c['school_id']]--;
                        $assigned = $c;
                        break;
                    }
                }
                if (! $assigned) {
                    continue;
                }

                $schoolRanks[$assigned['school_id']] = ($schoolRanks[$assigned['school_id']] ?? 0) + 1;
                $assignedStudents[$cands[$studentId][0]['student_id']] = $assigned['school_id'];
                $selectedPairs[$assigned['registration_id'].':'.$assigned['school_id']] = true;

                $row = [
                    'run_id' => $runId,
                    'registration_id' => $assigned['registration_id'],
                    'school_id' => $assigned['school_id'],
                    'admission_path_id' => $path->id,
                    'composite_score' => $assigned['score'],
                    'rank' => $schoolRanks[$assigned['school_id']],
                    'status' => 'selected',
                    'priority_used' => $assigned['priority'],
                    'nama' => $assigned['nama'],
                ];
                if ($persist) {
                    SelectionResult::create($row);
                }
                $out[] = $row;
            }

            // Persist not_selected rows for every other (student, choice) pair
            // — including for students this path could not seat.
            if ($persist) {
                foreach ($cands as $list) {
                    foreach ($list as $c) {
                        if (! isset($selectedPairs[$c['registration_id'].':'.$c['school_id']])) {
                            SelectionResult::create([
                                'run_id' => $runId,
                                'registration_id' => $c['registration_id'],
                                'school_id' => $c['school_id'],
                                'admission_path_id' => $path->id,
                                'composite_score' => $c['score'],
                                'rank' => null,
                                'status' => 'not_selected',
                                'priority_used' => $c['priority'],
                            ]);
                        }
                    }
                }
            }
        }

        return $out;
    }

    private function groupPreview(array $rows): array
    {
        $schools = [];
        foreach ($rows as $row) {
            $schools[$row['school_id']] ??= ['school_id' => $row['school_id'], 'school' => null, 'rows' => []];
            $schools[$row['school_id']]['rows'][] = [
                'nama' => $row['nama'] ?? null, // null when a control flow never set it — filled by the controller render otherwise
                'score' => $row['composite_score'],
                'rank' => $row['rank'],
                'priority' => $row['priority_used'],
            ];
        }

        return ['schools' => array_values($schools)];
    }
}
