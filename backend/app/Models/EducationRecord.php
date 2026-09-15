<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EducationRecord extends Model
{
    protected $fillable = ['student_id', 'sekolah_asal', 'nis_asal', 'tahun_lulus'];
}