<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotaRequest extends Model
{
    protected $fillable = [
        'school_id',
        'admission_path_id',
        'requested_kuota',
        'status',
        'notes',
        'approved_by',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function path(): BelongsTo
    {
        return $this->belongsTo(AdmissionPath::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
