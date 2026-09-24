<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelectionRule extends Model
{
    use Auditable;

    protected $fillable = [
        'admission_period_id', 'admission_path_id', 'score_weight',
        'distance_weight', 'tie_break', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'score_weight' => 'float',
            'distance_weight' => 'float',
            'is_active' => 'bool',
        ];
    }

    public function path(): BelongsTo
    {
        return $this->belongsTo(AdmissionPath::class, 'admission_path_id');
    }
}
