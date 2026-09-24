<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationChoice extends Model
{
    protected $fillable = ['registration_id', 'school_id', 'priority'];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
