<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentGuardian extends Model
{
    protected $table = 'parents';

    protected $fillable = [
        'student_id', 'nama_ayah', 'nama_ibu', 'pekerjaan_ayah', 'pekerjaan_ibu',
    ];
}