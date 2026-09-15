<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdmissionPath extends Model
{
    protected $fillable = ['admission_period_id', 'code', 'name', 'description', 'is_active'];

    public function requirements(): HasMany
    {
        return $this->hasMany(Requirement::class);
    }
}