<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Admin/Users', [
            'users' => User::orderBy('name')->get(),
            'roles' => ['admin_provinsi', 'admin_kabkota', 'operator_sekolah', 'verifikator', 'pendaftar'],
        ]);
    }

    public function updateRole(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'string', 'in:admin_provinsi,admin_kabkota,operator_sekolah,verifikator,pendaftar'],
        ]);

        $user = User::findOrFail($request->user_id);

        // Prevent admin from removing their own admin role to avoid lockout
        if ($user->id === $request->user()->id && in_array($request->role, ['pendaftar', 'operator_sekolah'])) {
            return back()->withErrors(['role' => 'Anda tidak dapat menghapus hak akses admin Anda sendiri.']);
        }

        $user->update(['role' => $request->role]);

        return back()->with('flash', [
            'success' => "Role user {$user->name} berhasil diperbarui menjadi {$request->role}.",
        ]);
    }
}
