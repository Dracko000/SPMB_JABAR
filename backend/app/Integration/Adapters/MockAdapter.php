<?php

namespace App\Integration\Adapters;

use App\Integration\DataIntegrationGateway;
use App\Integration\Exceptions\StudentNotFoundException;
use App\Integration\StudentRecord;
use App\Models\Student;

/**
 * Phase-1 adapter: reads realistic seeded students from the local DB.
 * When real gov endpoints exist, swap in an HttpClientAdapter behind
 * the same DataIntegrationGateway contract.
 */
class MockAdapter implements DataIntegrationGateway
{
    public function lookupByNisn(string $nisn): StudentRecord
    {
        $student = Student::where('nisn', $nisn)->first();

        if (! $student) {
            throw StudentNotFoundException::forNisn($nisn);
        }

        $parent = $student->parent;
        $address = $student->address;
        $edu = $student->educationRecord;

        return new StudentRecord(
            nisn: $student->nisn,
            nik: $student->nik,
            nama: $student->nama,
            tanggalLahir: $student->tanggal_lahir,
            jenisKelamin: $student->jenis_kelamin,
            agama: $student->agama,
            sekolahAsal: $edu?->sekolah_asal,
            tahunLulus: $edu?->tahun_lulus,
            alamat: $address?->alamat,
            namaAyah: $parent?->nama_ayah,
            namaIbu: $parent?->nama_ibu,
            rt: $address?->rt,
            rw: $address?->rw,
        );
    }
}