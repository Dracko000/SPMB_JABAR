<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdmissionPeriod extends Model
{
    protected $fillable = ['year', 'registration_start', 'registration_end', 'is_active'];

    public function paths(): HasMany
    {
        return $this->hasMany(AdmissionPath::class);
    }
}
