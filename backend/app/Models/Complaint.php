<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    protected $fillable = ['ticket_no', 'user_id', 'category', 'subject', 'message', 'status', 'admin_response'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
