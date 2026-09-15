<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Registration extends Model
{
    protected $fillable = [
        'no_pendaftaran', 'student_id', 'admission_period_id', 'admission_path_id',
        'user_id', 'status',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(AdmissionPeriod::class, 'admission_period_id');
    }

    public function path(): BelongsTo
    {
        return $this->belongsTo(AdmissionPath::class, 'admission_path_id');
    }

    public function choices(): HasMany
    {
        return $this->hasMany(RegistrationChoice::class)->orderBy('priority');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class);
    }
}