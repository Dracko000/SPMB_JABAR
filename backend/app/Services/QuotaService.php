<?php

namespace App\Services;

use App\Models\Quota;
use Illuminate\Support\Facades\DB;

/**
 * Enforces quota without over-subscription: atomic `kuota <= terisi`
 * guard inside a transaction on the quota row (PRD §18, §32).
 */
class QuotaService
{
    /**
     * Reserve one seat for a school+path. Throws on full quota.
     */
    public function reserve(int $schoolId, int $pathId): void
    {
        DB::transaction(function () use ($schoolId, $pathId) {
            $quota = Quota::where('school_id', $schoolId)
                ->where('admission_path_id', $pathId)
                ->lockForUpdate()
                ->first();

            if (! $quota) {
                throw new \RuntimeException('Jalur tidak tersedia untuk sekolah ini.');
            }

            if ($quota->terisi >= $quota->kuota) {
                throw new \RuntimeException('Kuota jalur sudah penuh.');
            }

            $quota->increment('terisi');
        });
    }

    /**
     * Release a reservation (removed choice, cancelled submission).
     */
    public function release(int $schoolId, int $pathId): void
    {
        DB::transaction(function () use ($schoolId, $pathId) {
            Quota::where('school_id', $schoolId)
                ->where('admission_path_id', $pathId)
                ->where('terisi', '>', 0)
                ->decrement('terisi');
        });
    }
}