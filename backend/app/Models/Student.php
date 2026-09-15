<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    protected $fillable = [
        'nisn', 'nik', 'nama', 'tanggal_lahir', 'jenis_kelamin', 'agama',
        'status_peserta', 'source',
    ];

    protected function casts(): array
    {
        return ['tanggal_lahir' => 'date'];
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }

    public function parent(): HasOne
    {
        return $this->hasOne(ParentGuardian::class);
    }

    public function address(): HasOne
    {
        return $this->hasOne(Address::class);
    }

    public function educationRecord(): HasOne
    {
        return $this->hasOne(EducationRecord::class);
    }
}