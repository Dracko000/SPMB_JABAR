<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Services\ComplaintService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplaintController extends Controller
{
    public function __construct(private readonly ComplaintService $svc) {}

    public function index(Request $request): Response
    {
        $query = Complaint::with('user')->orderByDesc('created_at');

        if ($request->user()->role === 'pendaftar') {
            $query->where('user_id', $request->user()->id);
        }

        return Inertia::render('Complaint/Index', [
            'complaints' => $query->get(),
            'categories' => ComplaintService::CATEGORIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:'.implode(',', ComplaintService::CATEGORIES)],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $this->svc->create($request->user()->id, $validated);

        return back()->with('flash', ['success' => 'Pengaduan dikirim.']);
    }

    public function respond(Request $request, Complaint $complaint): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:dibuat,diproses,selesai'],
            'response' => ['nullable', 'string', 'max:500'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'internal_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->svc->respond($request->user()->id, $complaint, $validated);

        return back()->with('flash', ['success' => 'Tanggapan disimpan.']);
    }
}
