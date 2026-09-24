<?php

namespace App\Services;

use App\Models\Region;
use App\Models\User;

/**
 * Data untuk panel Super Admin: akun admin provinsi/kabkota, status 2FA,
 * hak verifikasi global, dan statistik ringkas.
 */
class SuperadminService
{
    public function overview(): array
    {
        $admins = User::whereIn('role', ['superadmin', 'admin_provinsi', 'admin_kabkota'])
            ->get(['id', 'name', 'email', 'role', 'role_region_id', 'can_verify_all', 'google2fa_secret'])
            ->sortBy(fn (User $u) => sprintf(
                '%d-%s',
                ['superadmin' => 0, 'admin_provinsi' => 1, 'admin_kabkota' => 2][$u->role] ?? 9,
                $u->name,
            ));

        return [
            'admins' => $admins->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'region_id' => $u->role_region_id,
                'can_verify_all' => (bool) $u->can_verify_all,
                'twofa_enrolled' => ! empty($u->google2fa_secret),
                'is_superadmin' => $u->role === 'superadmin',
            ]),
            'regions' => Region::where('type', 'KABKOTA')->orderBy('name')->get(['id', 'name']),
            'stats' => [
                'admin_total' => User::whereIn('role', ['admin_provinsi', 'admin_kabkota'])->count(),
                'twofa_active' => User::whereIn('role', ['superadmin', 'admin_provinsi', 'admin_kabkota'])
                    ->whereNotNull('google2fa_secret')->count(),
                'global_verifiers' => User::where('can_verify_all', true)->count(),
            ],
        ];
    }
}