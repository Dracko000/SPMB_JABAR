<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IntegrationRequest extends Model
{
    protected $fillable = ['operator', 'payload', 'status'];

    public function responses(): HasMany
    {
        return $this->hasMany(IntegrationResponse::class);
    }
}
