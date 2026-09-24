<?php

namespace App\Support;

/**
 * Selection scoring: normalised score (0-100) plus a proximity credit
 * (100 - min(distance, 100)) so closer homes rank higher. Weighted per path
 * rule. Pure — no I/O, unit-testable in isolation.
 */
final class CompositeScore
{
    public static function compute(
        float $score,
        float $distanceKm,
        float $scoreWeight,
        float $distanceWeight,
    ): float {
        $distanceCredit = 100 - min($distanceKm, 100);

        return round(
            ($score * $scoreWeight) + ($distanceCredit * $distanceWeight),
            4,
        );
    }
}
