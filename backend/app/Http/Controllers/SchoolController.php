<?php

namespace App\Http\Controllers;

use App\Models\AdmissionPath;
use App\Models\QuotaRequest;
use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function index(Request $request): Response
    {
        // Assume the user is linked to a school via some mechanism.
        // For now, we find the school where this user is the operator.
        $school = School::whereHas('users', function ($q) use ($request) {
            $q->where('id', $request->user()->id);
        })->firstOrFail();

        return Inertia::render('School/Dashboard', [
            'school' => $school,
            'paths' => AdmissionPath::where('is_active', true)->get(),
            'requests' => QuotaRequest::where('school_id', $school->id)
                ->with('path')
                ->latest()
                ->get(),
        ]);
    }

    public function requestQuota(Request $request): RedirectResponse
    {
        $request->validate([
            'admission_path_id' => ['required', 'exists:admission_paths,id'],
            'requested_kuota' => ['required', 'integer', 'min:1'],
        ]);

        // Find the school for this operator
        $school = School::whereHas('users', function ($q) use ($request) {
            $q->where('id', $request->user()->id);
        })->firstOrFail();

        QuotaRequest::create([
            'school_id' => $school->id,
            'admission_path_id' => $request->admission_path_id,
            'requested_kuota' => $request->requested_kuota,
            'status' => 'pending',
        ]);

        return back()->with('flash', ['success' => 'Pengajuan kuota telah dikirim.']);
    }
}
