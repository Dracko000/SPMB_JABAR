<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Selection extends Model
{
    protected $fillable = ['registration_id', 'school_id', 'rank', 'status'];
}
