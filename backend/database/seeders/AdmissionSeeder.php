<?php

namespace Database\Seeders;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Requirement;
use App\Models\School;
use Illuminate\Database\Seeder;

class AdmissionSeeder extends Seeder
{
    public function run(): void
    {
        $period = AdmissionPeriod::create([
            'year' => 2026,
            'registration_start' => now()->subDays(10),
            'registration_end' => now()->addDays(20),
            'is_active' => true,
        ]);

        $paths = [
            ['code' => 'zonasi',    'name' => 'Jalur Zonasi'],
            ['code' => 'prestasi',  'name' => 'Jalur Prestasi'],
            ['code' => 'afirmasi',  'name' => 'Jalur Afirmasi'],
            ['code' => 'perpindahan', 'name' => 'Jalur Perpindahan Tugas'],
        ];

        $requirementsByPath = [
            'zonasi' => [
                ['code' => 'akte', 'name' => 'Akta Kelahiran'],
                ['code' => 'kk', 'name' => 'Kartu Keluarga'],
                ['code' => 'rapor', 'name' => 'Rapor Semester 1-5'],
            ],
            'prestasi' => [
                ['code' => 'akte', 'name' => 'Akta Kelahiran'],
                ['code' => 'rapor', 'name' => 'Rapor Semester 1-5'],
                ['code' => 'sertifikat', 'name' => 'Sertifikat Prestasi'],
            ],
            'afirmasi' => [
                ['code' => 'akte', 'name' => 'Akta Kelahiran'],
                ['code' => 'kk', 'name' => 'Kartu Keluarga'],
                ['code' => 'kip', 'name' => 'Kartu KIP/PKH'],
            ],
            'perpindahan' => [
                ['code' => 'akte', 'name' => 'Akta Kelahiran'],
                ['code' => 'skpindah', 'name' => 'SK Pindah Tugas'],
            ],
        ];

        $createdPaths = [];

        foreach ($paths as $index => $p) {
            $path = AdmissionPath::create([
                'admission_period_id' => $period->id,
                'code' => $p['code'],
                'name' => $p['name'],
                'description' => 'Pendaftaran melalui '.$p['name'],
                'is_active' => true,
            ]);
            $createdPaths[$p['code']] = $path;

            foreach ($requirementsByPath[$p['code']] as $req) {
                Requirement::create([
                    'admission_path_id' => $path->id,
                    'code' => $req['code'],
                    'name' => $req['name'],
                    'required' => true,
                ]);
            }

            // quota per school-path
            foreach (School::all() as $school) {
                Quota::create([
                    'school_id' => $school->id,
                    'admission_path_id' => $path->id,
                    'kuota' => max((int) ($school->capacity * 0.25), 40),
                    'terisi' => 0,
                ]);
            }
        }
    }
}
