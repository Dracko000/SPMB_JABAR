<?php

use App\Models\AdmissionPath;
use App\Models\User;

it('rejects selection rule weights whose sum exceeds 1', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();

    $this->actingAs($admin)->post('/admin/seleksi/rules', [
        'path_id' => $path->id,
        'score_weight' => 0.6,
        'distance_weight' => 0.6,
        'tie_break' => 'date_submitted_asc',
    ])->assertSessionHasErrors('score_weight');
});