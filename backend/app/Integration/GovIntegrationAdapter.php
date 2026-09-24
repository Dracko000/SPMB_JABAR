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

        // Map array dari service ke StudentRecord DTO
        return new StudentRecord(
            nisn: $data['identity']['nisn'],
            nik: $data['identity']['nik'],
            nama: $data['identity']['nama'],
            tanggalLahir: $data['identity']['tanggal_lahir'],
            jenisKelamin: $data['identity']['jenis_kelamin'],
            agama: $data['identity']['agama'],
            statusPeserta: $data['identity']['status_peserta'],
            alamat: $data['address']['alamat'],
            regionId: $data['address']['region_id'],
            rt: $data['address']['rt'],
            rw: $data['address']['rw'],
            namaAyah: $data['parents']['nama_ayah'],
            namaIbu: $data['parents']['nama_ibu'],
            pekerjaanAyah: $data['parents']['pekerjaan_ayah'],
            pekerjaanIbu: $data['parents']['pekerjaan_ibu'],
            sekolahAsal: $data['education']['sekolah_asal'],
            nisAsal: $data['education']['nis_asal'],
            tahunLulus: $data['education']['tahun_lulus']
        );
    }
}
