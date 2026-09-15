<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\EducationRecord;
use App\Models\ParentGuardian;
use App\Models\Region;
use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // 6 realistic mock students matching the gateway. NISNs are valid 10-digit formats.
        $records = [
            [
                'nisn' => '0069031234', 'nik' => '3201041003120001', 'nama' => 'Alya Rahma Nabila',
                'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '2012-03-10', 'jenis_kelamin' => 'P', 'agama' => 'Islam',
                'nilai_prestasi' => 92.5, 'jarak_domisili_km' => 1.8,
                'sekolah_asal' => 'SDN Cihampelas 1', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Cihampelas No. 15', 'rt' => '03', 'rw' => '05',
                'ayah' => 'Didin Suryadi', 'ibu' => 'Siti Nurhayati',
            ],
            [
                'nisn' => '0075123456', 'nik' => '3201224508120002', 'nama' => 'Bima Ardiansyah',
                'tempat_lahir' => 'Kab. Bandung', 'tanggal_lahir' => '2012-08-05', 'jenis_kelamin' => 'L', 'agama' => 'Islam',
                'nilai_prestasi' => 88.0, 'jarak_domisili_km' => 4.2,
                'sekolah_asal' => 'SDN Rancabali 3', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Rancabali No. 7', 'rt' => '01', 'rw' => '02',
                'ayah' => 'Asep Saepudin', 'ibu' => 'Euis Komariah',
            ],
            [
                'nisn' => '0082345678', 'nik' => '3203251111120003', 'nama' => 'Cici Melani Putri',
                'tempat_lahir' => 'Cianjur', 'tanggal_lahir' => '2012-11-05', 'jenis_kelamin' => 'P', 'agama' => 'Islam',
                'nilai_prestasi' => 95.0, 'jarak_domisili_km' => 9.0,
                'sekolah_asal' => 'SDN Cianjur Kota', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Pasar Baru No. 3', 'rt' => '04', 'rw' => '06',
                'ayah' => 'Rudi Hartono', 'ibu' => 'Lilis Nurliani',
            ],
            [
                'nisn' => '0098765432', 'nik' => '3276012304120004', 'nama' => 'Doni Firmansyah',
                'tempat_lahir' => 'Depok', 'tanggal_lahir' => '2012-04-12', 'jenis_kelamin' => 'L', 'agama' => 'Kristen',
                'nilai_prestasi' => 76.0, 'jarak_domisili_km' => 12.5,
                'sekolah_asal' => 'SDN Depok Jaya', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Margonda Raya No. 88', 'rt' => '02', 'rw' => '08',
                'ayah' => 'Yohanes Widodo', 'ibu' => 'Maria Susanti',
            ],
            [
                'nisn' => '0101234567', 'nik' => '3213901705120005', 'nama' => 'Eka Prasetyo',
                'tempat_lahir' => 'Sukabumi', 'tanggal_lahir' => '2012-12-17', 'jenis_kelamin' => 'L', 'agama' => 'Islam',
                'nilai_prestasi' => 90.0, 'jarak_domisili_km' => 3.1,
                'sekolah_asal' => 'SDN Sukabumi 5', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Veteran No. 21', 'rt' => '05', 'rw' => '03',
                'ayah' => 'Agus Salim', 'ibu' => 'Rina Marlina',
            ],
            [
                'nisn' => '0113456789', 'nik' => '3204160909120006', 'nama' => 'Fitri Handayani',
                'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '2012-09-09', 'jenis_kelamin' => 'P', 'agama' => 'Islam',
                'nilai_prestasi' => 84.0, 'jarak_domisili_km' => 6.7,
                'sekolah_asal' => 'SDN Sukasari 2', 'tahun_lulus' => 2024,
                'alamat' => 'Jl. Buah Batu No. 45', 'rt' => '06', 'rw' => '04',
                'ayah' => 'Hendra Gunawan', 'ibu' => 'Dewi Anggraini',
            ],
        ];

        foreach ($records as $data) {
            $student = Student::create([
                'nisn' => $data['nisn'],
                'nik' => $data['nik'],
                'nama' => $data['nama'],
                'tempat_lahir' => $data['tempat_lahir'],
                'tanggal_lahir' => $data['tanggal_lahir'],
                'jenis_kelamin' => $data['jenis_kelamin'],
                'agama' => $data['agama'],
                'nilai_prestasi' => $data['nilai_prestasi'],
                'jarak_domisili_km' => $data['jarak_domisili_km'],
                'status_peserta' => 'calon',
                'source' => 'mock',
            ]);

            ParentGuardian::create([
                'student_id' => $student->id,
                'nama_ayah' => $data['ayah'],
                'nama_ibu' => $data['ibu'],
            ]);

            $region = Region::where('type', 'kabkota')->inRandomOrder()->first();

            Address::create([
                'student_id' => $student->id,
                'alamat' => $data['alamat'],
                'region_id' => $region?->id,
                'rt' => $data['rt'],
                'rw' => $data['rw'],
            ]);

            EducationRecord::create([
                'student_id' => $student->id,
                'sekolah_asal' => $data['sekolah_asal'],
                'nis_asal' => (string) random_int(100000000, 999999999),
                'tahun_lulus' => (int) $data['tahun_lulus'],
            ]);
        }
    }
}