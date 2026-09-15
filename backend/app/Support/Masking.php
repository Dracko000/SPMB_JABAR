<?php

namespace App\Support;

/**
 * Data masking (PRD §24): partial reveal of NIK/NISN in views.
 * NIK 3215******1234**, NISN 0061****87.
 */
class Masking
{
    public static function nik(string $nik): string
    {
        return strlen($nik) >= 6
            ? substr($nik, 0, 4).str_repeat('*', max(strlen($nik) - 8, 4)).substr($nik, -4)
            : $nik;
    }

    public static function nisn(string $nisn): string
    {
        return strlen($nisn) >= 4
            ? substr($nisn, 0, 4).str_repeat('*', max(strlen($nisn) - 6, 2)).substr($nisn, -2)
            : $nisn;
    }

    public static function phone(string $phone): string
    {
        if (strlen($phone) < 6) {
            return $phone;
        }

        return substr($phone, 0, 3).str_repeat('*', max(strlen($phone) - 6, 3)).substr($phone, -3);
    }
}