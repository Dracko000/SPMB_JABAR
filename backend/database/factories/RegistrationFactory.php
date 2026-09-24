<?php

namespace Database\Factories;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    public function definition(): array
    {
        return [
            'no_pendaftaran' => 'REG-'.strtoupper(\Str::random(8)),
            'student_id' => Student::inRandomOrder()->first()?->id ?? Student::factory(),
            'admission_period_id' => AdmissionPeriod::first()?->id ?? 1,
            'admission_path_id' => AdmissionPath::inRandomOrder()->first()?->id ?? 1,
            'status' => 'pending',
            'verification_evidence' => null,
        ];
    }
}
