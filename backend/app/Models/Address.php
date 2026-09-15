<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = ['student_id', 'alamat', 'region_id', 'rt', 'rw'];

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }
}