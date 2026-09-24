<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationResponse extends Model
{
    protected $fillable = ['integration_request_id', 'body', 'status'];
}
