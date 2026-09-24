<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PublicDownload extends Model
{
    protected $fillable = ['title', 'file_path', 'category', 'version', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
