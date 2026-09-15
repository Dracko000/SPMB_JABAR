<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Requirement extends Model
{
    protected $fillable = ['admission_path_id', 'code', 'name', 'required'];

    protected function casts(): array
    {
        return ['required' => 'boolean'];
    }
}