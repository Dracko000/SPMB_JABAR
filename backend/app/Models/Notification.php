<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'payload', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'payload' => 'array'];
    }
}
