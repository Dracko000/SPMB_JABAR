<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = ['registration_id', 'type', 'path', 'status', 'catatan'];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }
}