<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $bandung = Region::where('code', '3204')->first();
        $jabar = Region::where('code', '32')->first();
        $smpn1Bdg = School::where('npsn', '20219801')->first();

        $users = [
            [
                'name' => 'Admin Provinsi', 'email' => 'admin.provinsi@spmb.jabar',
                'role' => 'admin_provinsi', 'region' => $jabar?->id, 'school' => null,
            ],
            [
                'name' => 'Admin Kabupaten Bandung', 'email' => 'admin.kab@spmb.jabar',
                'role' => 'admin_kabkota', 'region' => $bandung?->id, 'school' => null,
            ],
            [
                'name' => 'Operator SMPN 1 Bandung', 'email' => 'operator.smpn1@spmb.jabar',
                'role' => 'operator_sekolah', 'region' => $bandung?->id, 'school' => $smpn1Bdg?->id,
            ],
            [
                'name' => 'Verifikator', 'email' => 'verifikator@spmb.jabar',
                'role' => 'verifikator', 'region' => $jabar?->id, 'school' => null,
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'password' => 'password',
                    'role' => $u['role'],
                    'role_region_id' => $u['region'],
                    'school_id' => $u['school'],
                ],
            );
        }
    }
}