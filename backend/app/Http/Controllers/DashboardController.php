<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $svc) {}

    public function show(Request $request): Response
    {
        return match ($request->user()->role) {
            'pendaftar' => Inertia::render('Dashboard/Pendaftar', $this->svc->pendaftar($request->user())),
            'operator_sekolah' => Inertia::render('Dashboard/Sekolah', $this->svc->sekolah($request->user())),
            'admin_kabkota' => Inertia::render('Dashboard/Kabkota', $this->svc->kabkota($request->user())),
            'admin_provinsi' => Inertia::render('Dashboard/Provinsi', $this->svc->provinsi()),
            'verifikator' => Inertia::render('Dashboard/Provinsi', $this->svc->provinsi()),
            default => Inertia::render('Landing'),
        };
    }
}