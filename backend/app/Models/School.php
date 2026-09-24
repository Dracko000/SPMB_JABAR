<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    protected $fillable = [
        'npsn', 'name', 'region_id', 'address', 'capacity',
        'latitude', 'longitude', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function quotas(): HasMany
    {
        return $this->hasMany(Quota::class);
    }

    public function choices(): HasMany
    {
        return $this->hasMany(RegistrationChoice::class);
    }

    /**
     * Registrations that picked this school as one of their choices
     * (via the registration_choices pivot), used for withCount/aggregates.
     */
    public function registrations(): BelongsToMany
    {
        return $this->belongsToMany(Registration::class, 'registration_choices')
            ->withPivot('priority')
            ->withTimestamps();
    }
}
