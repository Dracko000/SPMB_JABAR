<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class DocumentViewController extends Controller
{
    public function __construct(private readonly DocumentService $documents) {}

    /**
     * Serve a private document file with strict ownership checks and an
     * integrity gate: access is blocked (with audit trail) when the stored
     * bytes no longer match the fingerprint recorded at upload time.
     */
    public function show(Request $request, $id): Response
    {
        $document = Document::findOrFail($id);
        $registration = $document->registration;
        $user = $request->user();

        $isOwner = $registration->user_id === $user->id;
        $isAdmin = in_array($user->role, ['admin_provinsi', 'admin_kabkota'], true);
        $isVerificator = in_array($user->role, ['operator_sekolah', 'verifikator'], true);
        $isGlobal = $user->role === 'superadmin' || (bool) $user->can_verify_all;

        if (! $isOwner && ! $isAdmin && ! $isVerificator && ! $isGlobal) {
            abort(403, 'Anda tidak memiliki izin untuk mengakses dokumen ini.');
        }

        // ── Gerbang integritas (anti pengubahan dokumen) ────────────────
        $state = $this->documents->auditIntegrity($document);

        if ($state['status'] === 'missing') {
            abort(404, 'Berkas tidak ditemukan di penyimpanan. Kejadian ini telah dicatat.');
        }

        if ($state['status'] === 'tampered') {
            abort(409, 'Berkas berubah setelah unggahan (hash tidak cocok). Akses diblokir dan kejadian ini telah dicatat.');
        }

        $response = Storage::disk('local')->response($document->path);
        $response->headers->set('X-Document-SHA256', substr((string) $document->sha256, 0, 16));

        return $response;
    }
}