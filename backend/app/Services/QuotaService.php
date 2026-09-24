<?php

namespace App\Services;

use App\Models\Quota;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class QuotaService
{
    /**
     * Reserve quota for a specific school and admission path.
     * Uses a database transaction with pessimistic locking to prevent over-subscription.
     *
     * @throws RuntimeException
     */
    public function reserve(int $schoolId, int $pathId): void
    {
        DB::transaction(function () use ($schoolId, $pathId) {
            // Lock the row to prevent race conditions
            $quota = Quota::where('school_id', $schoolId)
                ->where('admission_path_id', $pathId)
                ->lockForUpdate()
                ->first();

            if (! $quota) {
                throw new RuntimeException('Kuota untuk jalur ini di sekolah tujuan tidak tersedia.');
            }

            if ($quota->terisi >= $quota->kuota) {
                throw new RuntimeException('Kuota sekolah tujuan sudah penuh untuk jalur ini.');
            }

            $quota->increment('terisi');

            Log::info("QuotaService: Reserved quota for School {$schoolId}, Path {$pathId}. Current: {$quota->terisi}/{$quota->kuota}");
        });

        // Clear public caches since quotas have changed
        $this->clearPublicCaches();
    }

    /**
     * Release quota if registration is cancelled or rejected.
     */
    public function release(int $schoolId, int $pathId): void
    {
        DB::transaction(function () use ($schoolId, $pathId) {
            $quota = Quota::where('school_id', $schoolId)
                ->where('admission_path_id', $pathId)
                ->lockForUpdate()
                ->first();

            if ($quota && $quota->terisi > 0) {
                $quota->decrement('terisi');
            }
        });

        // Clear public caches since quotas have changed
        $this->clearPublicCaches();
    }

    /**
     * Clear all cached public directory and landing page data.
     */
    private function clearPublicCaches(): void
    {
        // In a real production environment, we might use tags: Cache::tags(['public_data'])->flush();
        // For now, we manually clear the primary entry points.
        Cache::forget('public_active_paths');
        Cache::forget('public_active_schools');
        Cache::forget('public_downloads_list');

        // For the directory paginated cache, we'd ideally use tags.
        // Without tags, we rely on the 1-hour TTL for the search results.
    }
}
