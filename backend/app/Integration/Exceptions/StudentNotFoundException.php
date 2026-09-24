<?php

namespace App\Integration\Exceptions;

use RuntimeException;

class StudentNotFoundException extends RuntimeException
{
    public static function forNisn(string $nisn): self
    {
        return new self("Data peserta dengan NISN {$nisn} tidak ditemukan.");
    }
}
