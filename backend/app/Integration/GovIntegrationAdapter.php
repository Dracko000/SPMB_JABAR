<?php

namespace App\Integration;

use App\Integration\Exceptions\StudentNotFoundException;
use App\Services\Integration\IntegrationService;
use Illuminate\Support\Facades\Log;

class GovIntegrationAdapter implements DataIntegrationGateway
{
    public function __construct(private readonly IntegrationService $service) {}

    public function lookupByNisn(string $nisn): StudentRecord
    {
        Log::info("GovIntegrationAdapter: Looking up NISN {$nisn}");

        if (! $this->service->verifyNisn($nisn)) {
            throw new StudentNotFoundException("NISN {$nisn} tidak ditemukan atau tidak valid di sistem pemerintah.");
        }

        $data = $this->service->fetchStudentData($nisn);

        if (! $data) {
            throw new StudentNotFoundException("Data untuk NISN {$nisn} tidak tersedia.");
        }

        // Map array dari service ke StudentRecord DTO (hanya field yang
        // dimiliki DTO — field ekstra upstream TIDAK diteruskan).
        return new StudentRecord(
            nisn: (string) $data['identity']['nisn'],
            nik: (string) $data['identity']['nik'],
            nama: (string) $data['identity']['nama'],
            tempatLahir: $data['identity']['tempat_lahir'] ?? null,
            tanggalLahir: isset($data['identity']['tanggal_lahir'])
                ? \Illuminate\Support\Carbon::parse($data['identity']['tanggal_lahir'])
                : null,
            jenisKelamin: (string) ($data['identity']['jenis_kelamin'] ?? 'L'),
            agama: $data['identity']['agama'] ?? null,
            sekolahAsal: $data['education']['sekolah_asal'] ?? null,
            tahunLulus: isset($data['education']['tahun_lulus'])
                ? (string) $data['education']['tahun_lulus']
                : null,
            alamat: $data['address']['alamat'] ?? null,
            namaAyah: $data['parents']['nama_ayah'] ?? null,
            namaIbu: $data['parents']['nama_ibu'] ?? null,
            rt: $data['address']['rt'] ?? null,
            rw: $data['address']['rw'] ?? null,
        );
    }
}
