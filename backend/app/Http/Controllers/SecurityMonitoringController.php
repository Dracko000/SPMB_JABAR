<?php

namespace App\Http\Controllers;

use App\Services\SecurityMonitoringService;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Halaman Monitoring Keamanan.
 *
 * Ada untuk satu alasan: log audit yang tidak pernah dibaca tidak berguna.
 * Halaman ini mengubah log mentah menjadi tren, anomali terbaru, dan
 * daftar pelaku yang perlu ditinjau.
 *
 * Akses: superadmin (2FA wajib) dan admin provinsi, karena keduanya
 * memegang keputusan operasional di wilayahnya masing-masing.
 */
class SecurityMonitoringController extends Controller
{
    public function __construct(private readonly SecurityMonitoringService $svc) {}

    public function index(Request $request): Response
    {
        // Event divalidasi terhadap katalog, bukan hanya max:60 — supaya
        // ?event=yang-enggak-ada ditolak dengan pesan jelas, bukan diam-diam
        // mengembalikan tabel kosong yang bikin pembaca mengira "aman".
        $filters = $request->validate([
            'severity' => ['nullable', 'in:critical,warning,info'],
            'event' => ['nullable', 'string', 'max:60'],
            'days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $filters = array_filter($filters);

        if (isset($filters['event']) && ! array_key_exists($filters['event'], SecurityMonitoringService::catalogue())) {
            throw ValidationException::withMessages([
                'event' => 'Jenis event tidak dikenal.',
            ]);
        }

        // Membuka halaman monitoring = akses ke jejak audit seluruh sistem.
        // Dicatat supaya "siapa yang melihat log" pun bisa diaudit.
        Audit::log('security.monitoring.viewed', ['filters' => $filters]);
        return Inertia::render('Security/Monitoring', [
            ...$this->svc->overview(['filters' => $filters]),
            'integrity' => $this->svc->integritySummary(),
        ]);
    }
}
