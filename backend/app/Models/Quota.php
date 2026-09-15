<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quota extends Model
{
    protected $fillable = ['school_id', 'admission_path_id', 'kuota', 'terisi'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function path(): BelongsTo
    {
        return $this->belongsTo(AdmissionPath::class, 'admission_path_id');
    }
}