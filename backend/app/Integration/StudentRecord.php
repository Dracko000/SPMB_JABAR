<?php

namespace App\Integration;

use Illuminate\Support\Carbon;

/**
 * Value object returned by the gateway — what an upstream gov source
 * would hand us. Immutable.
 */
readonly class StudentRecord
{
    public function __construct(
        public string $nisn,
        public string $nik,
        public string $nama,
        public ?string $tempatLahir,
        public ?Carbon $tanggalLahir,
        public string $jenisKelamin,
        public ?string $agama,
        public ?string $sekolahAsal,
        public ?string $tahunLulus,
        public ?string $alamat,
        public ?string $namaAyah,
        public ?string $namaIbu,
        public ?string $rt,
        public ?string $rw,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            nisn: (string) $data['nisn'],
            nik: (string) $data['nik'],
            nama: (string) $data['nama'],
            tempatLahir: $data['tempat_lahir'] ?? null,
            tanggalLahir: isset($data['tanggal_lahir'])
                ? Carbon::parse($data['tanggal_lahir'])
                : null,
            jenisKelamin: (string) ($data['jenis_kelamin'] ?? 'L'),
            agama: $data['agama'] ?? null,
            sekolahAsal: $data['sekolah_asal'] ?? null,
            tahunLulus: isset($data['tahun_lulus']) ? (string) $data['tahun_lulus'] : null,
            alamat: $data['alamat'] ?? null,
            namaAyah: $data['nama_ayah'] ?? null,
            namaIbu: $data['nama_ibu'] ?? null,
            rt: $data['rt'] ?? null,
            rw: $data['rw'] ?? null,
        );
    }
}