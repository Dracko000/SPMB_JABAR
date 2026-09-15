<?php

namespace App\Http\Controllers;

use App\Models\AdmissionPath;
use App\Models\School;
use App\Services\DocumentService;
use App\Services\RegistrationFlow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function __construct(
        private readonly RegistrationFlow $flow,
        private readonly DocumentService $documents,
    ) {}

    /**
     * Wizard: pick jalur → school choices → upload docs → review → submit.
     */
    public function show(Request $request): Response
    {
        $registration = $this->flow->draftOrCreate($request->user());

        $paths = AdmissionPath::with('requirements')->where('is_active', true)->get();
        $schools = School::with('region')->where('is_active', true)
            ->orderBy('name')->get();

        return Inertia::render('Registration/Show', [
            'registration' => $registration->load(['choices.school.region', 'path', 'documents', 'period']),
            'paths' => $paths,
            'schools' => $schools,
            'step' => $this->currentStep($registration),
        ]);
    }

    public function pickPath(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'path_code' => ['required', 'string', 'exists:admission_paths,code'],
        ]);

        $registration = $this->flow->draftOrCreate($request->user());

        try {
            $this->flow->pickPath($registration, $validated['path_code']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['path' => $e->getMessage()]);
        }

        return back()->with('flash', ['success' => 'Jalur dipilih.']);
    }

    public function saveChoices(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'school_ids' => ['required', 'array', 'min:1', 'max:5'],
            'school_ids.*' => ['integer', 'exists:schools,id'],
        ]);

        $registration = $this->flow->draftOrCreate($request->user());

        $this->flow->setChoices($registration, $validated['school_ids']);

        return back()->with('flash', ['success' => 'Pilihan sekolah disimpan.']);
    }

    public function uploadDocument(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'max:30'],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ]);

        $registration = $this->flow->draftOrCreate($request->user());

        if (! $registration->admission_path_id) {
            return back()->withErrors(['type' => 'Pilih jalur terlebih dahulu.']);
        }

        $this->documents->store(
            $registration->id,
            $request->user()->student->nisn,
            $validated['type'],
            $validated['file'],
        );

        return back()->with('flash', ['success' => 'Dokumen diunggah.']);
    }

    public function submit(Request $request): \Illuminate\Http\RedirectResponse
    {
        $registration = $this->flow->draftOrCreate($request->user());

        try {
            $this->flow->submit($registration);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['submit' => $e->getMessage()]);
        }

        return redirect()->route('registration.complete', $registration->no_pendaftaran);
    }

    public function complete(Request $request, string $noPendaftaran): Response
    {
        $registration = $request->user()->registration
            ->load('path', 'choices.school.region');

        abort_if($registration->no_pendaftaran !== $noPendaftaran, 404);

        return Inertia::render('Registration/Complete', [
            'registration' => $registration,
        ]);
    }

    private function currentStep($registration): int
    {
        if (! $registration->admission_path_id) {
            return 1;
        }
        if ($registration->choices()->count() === 0) {
            return 2;
        }
        if ($registration->documents()->count() === 0) {
            return 3;
        }

        return 4;
    }
}