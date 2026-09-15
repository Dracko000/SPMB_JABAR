<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\School;
use Illuminate\Database\Seeder;

class RegionSchoolSeeder extends Seeder
{
    public function run(): void
    {
        $provJabar = Region::create(['type' => 'provinsi', 'code' => '32', 'name' => 'JAWA BARAT']);

        $kabkota = [
            ['code' => '3201', 'name' => 'KAB. BOGOR'],
            ['code' => '3202', 'name' => 'KAB. SUKABUMI'],
            ['code' => '3203', 'name' => 'KAB. CIANJUR'],
            ['code' => '3204', 'name' => 'KAB. BANDUNG'],
            ['code' => '3273', 'name' => 'KOTA BANDUNG'],
            ['code' => '3276', 'name' => 'KOTA DEPOK'],
        ];

        $regionsByCode = ['32' => $provJabar];

        foreach ($kabkota as $k) {
            $regionsByCode[$k['code']] = Region::create([
                'parent_id' => $provJabar->id,
                'type' => 'kabkota',
                'code' => $k['code'],
                'name' => $k['name'],
            ]);
        }

        $schools = [
            ['npsn' => '20219801', 'name' => 'SMPN 1 Bandung',   'region' => '3204', 'capacity' => 320],
            ['npsn' => '20219802', 'name' => 'SMPN 2 Bandung',   'region' => '3204', 'capacity' => 288],
            ['npsn' => '20219803', 'name' => 'SMPN 1 Cianjur',   'region' => '3203', 'capacity' => 256],
            ['npsn' => '20219804', 'name' => 'SMPN 1 Bogor',     'region' => '3201', 'capacity' => 300],
            ['npsn' => '20219805', 'name' => 'SMPN 3 Depok',     'region' => '3276', 'capacity' => 240],
            ['npsn' => '20219806', 'name' => 'SMPN 5 Sukabumi',  'region' => '3202', 'capacity' => 224],
        ];

        foreach ($schools as $s) {
            School::create([
                'npsn' => $s['npsn'],
                'name' => $s['name'],
                'region_id' => $regionsByCode[$s['region']]->id,
                'address' => "Jl. {$s['name']} No. 1",
                'capacity' => $s['capacity'],
                'is_active' => true,
            ]);
        }
    }
}