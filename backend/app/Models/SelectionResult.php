<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SelectionResult extends Model
{
    protected $fillable = [
        'run_id', 'registration_id', 'school_id', 'admission_path_id',
        'composite_score', 'rank', 'status', 'priority_used',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $model) => $model->run_id ??= (string) Str::uuid());
    }

    protected function casts(): array
    {
        return ['composite_score' => 'float'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}