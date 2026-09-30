<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\Document;
use App\Services\DocumentService;
use App\Services\VerificationFlow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerificationController extends Controller
{
    public function __construct(
        private readonly VerificationFlow $flow,
        private readonly DocumentService $documents,
    ) {}

    /**
     * Antrean verifikasi. operator_sekolah hanya melihat pendaftar yang
     * memilih sekolahnya; superadmin & pemegang hak can_verify_all melihat
     * SELURUH pendaftar semua sekolah (acc lintas wilayah).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isGlobal = $user->role === 'superadmin' || (bool) $user->can_verify_all;

        $registrations = Registration::whereIn('status', ['submitted', 'terverifikasi_awal'])
            ->when(! $isGlobal, fn ($q) => $q->whereHas('choices', fn ($c) => $c->where('school_id', $user->school_id)))
            ->with(['student', 'path', 'path.requirements', 'choices.school', 'documents'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Verification/Index', [
            'registrations' => $registrations->map(function (Registration $r) {
                return [
                    'id' => $r->id,
                    'no_pendaftaran' => $r->no_pendaftaran,
                    'status' => $r->status,
                    'student' => $r->student,
                    'path' => $r->path,
                    'choices' => $r->choices->map(fn ($c) => ['school' => $c->school]),
                    'documents' => $r->documents
                        ->sortByDesc('id')
                        ->map(fn (Document $d) => [
                            'id' => $d->id,
                            'type' => $d->type,
                            'status' => $d->status,
                            'catatan' => $d->catatan,
                            'original_name' => $d->original_name,
                            'size_kb' => $d->size_bytes ? round($d->size_bytes / 1024, 1) : null,
                            'sha256' => $d->sha256 ? substr($d->sha256, 0, 12) : null,
                            'verified' => ! is_null($d->verified_sha256),
                            'integrity' => $this->documents->integrity($d)['status'],
                        ])
                        ->values(),
                ];
            })->values(),
            'global' => $isGlobal,
        ]);
    }

    public function review(Request $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:valid,ditolak,perbaikan'],
            'is_kk_verified' => ['required', 'boolean'],
            'is_ijazah_verified' => ['required', 'boolean'],
            'is_alamat_verified' => ['required', 'boolean'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            // No writes happen here: scope/state checks and the document-flag
            // update live inside VerificationFlow::review (transactional), so an
            // out-of-scope operator can never mutate the row before the 403.
            $this->flow->review(
                $registration,
                $request->user(),
                $validated['status'],
                $validated['catatan'] ?? null,
                [
                    'is_kk_verified' => $validated['is_kk_verified'],
                    'is_ijazah_verified' => $validated['is_ijazah_verified'],
                    'is_alamat_verified' => $validated['is_alamat_verified'],
                ]
            );

        } catch (HttpException $e) {
            // Preserve HTTP semantics — abort(403) from the flow must not be
            // swallowed into a generic redirect.
            throw $e;
        } catch (\Exception $e) {
            return back()->withErrors(['review' => $e->getMessage() ?: 'Terjadi kesalahan saat menyimpan verifikasi.']);
        }

        return back()->with('flash', ['success' => 'Hasil verifikasi berhasil disimpan.']);
    }
}
