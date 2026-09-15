<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Verification extends Model
{
    protected $fillable = ['registration_id', 'actor_id', 'status', 'catatan'];
}