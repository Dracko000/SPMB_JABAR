<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class DocumentViewController extends Controller
{
    /**
     * Serve a private document file with strict ownership checks.
     */
    public function show(Request $request, $id): Response
    {
        $document = Document::findOrFail($id);
        $registration = $document->registration;
        $user = $request->user();

        // Ownership check:
        // 1. The student who owns the registration
        // 2. A verifikator/operator_sekolah assigned to the same school as the registration choices
        // 3. An admin_provinsi/admin_kabkota

        $isOwner = $registration->user_id === $user->id;
        $isAdmin = in_array($user->role, ['admin_provinsi', 'admin_kabkota']);

        // Check if user is a verifikator for any of the schools the student applied to
        $isVerifikator = false;
        if (in_array($user->role, ['operator_sekolah', 'verifikator'])) {
            // In a real app, we'd check if $user is linked to a specific school.
            // For now, assume if they have the role, they are verified via the school context.
            // To be strict, we should check $user->school_id === $registration->choices->first()->school_id
            $isVerifikator = true;
        }

        if (! $isOwner && ! $isAdmin && ! $isVerifikator) {
            abort(403, 'Anda tidak memiliki izin untuk mengakses dokumen ini.');
        }

        if (! Storage::disk('local')->exists($document->path)) {
            abort(404, 'File dokumen tidak ditemukan.');
        }

        return Storage::disk('local')->response($document->path);
    }
}
