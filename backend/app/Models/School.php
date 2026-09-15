<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class School extends Model
{
    protected $fillable = [
        'npsn', 'name', 'region_id', 'address', 'capacity',
        'lat', 'lng', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function quotas()
    {
        return $this->hasMany(Quota::class);
    }
}