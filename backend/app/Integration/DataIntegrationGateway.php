<?php

namespace App\Integration;

/**
 * Contract for external student-data sources (Dapodik/PDSPK/Sudati/Disdukcapil).
 * Phase 1 uses the mock adapter; real gov endpoints implement this same interface.
 */
interface DataIntegrationGateway
{
    /**
     * Look up a student by NISN.
     *
     * Returns a StudentRecord dto or throws StudentNotFoundException.
     */
    public function lookupByNisn(string $nisn): StudentRecord;
}
