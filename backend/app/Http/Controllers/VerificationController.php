<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Services\VerificationFlow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    public function __construct(private readonly VerificationFlow $flow) {}

    /**
     * operator_sekolah queue — registrations that chose their school.
     */
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $registrations = Registration::where('status', 'submitted')
            ->whereHas('choices', fn ($q) => $q->where('school_id', $schoolId))
            ->with(['student', 'path', 'choices.school', 'documents'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Verification/Index', [
            'registrations' => $registrations,
        ]);
    }

    public function review(Request $request, Registration $registration): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:valid,ditolak,perbaikan'],
            'catatan' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $this->flow->review(
                $registration,
                $request->user(),
                $validated['status'],
                $validated['catatan'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['review' => $e->getMessage()]);
        }

        return back()->with('flash', ['success' => 'Status verifikasi disimpan.']);
    }
}