<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Monitoring keamanan — mengubah log audit menjadi angka yang bisa ditindaklanjuti.
 *
 * Prinsipnya: event keamanan yang hanya tersimpan di log tidak berguna
 * kalau tidak ada yang membacanya. Service ini mengubah log mentah
 * menjadi: (1) angka tren, (2) daftar anomali terbaru, (3) suspected
 * actors — supaya reviewer bisa memutuskan, bukan hanya membaca.
 *
 * PENTING soalconsole guard: deteksi F12 hanyalah deterrence. Angkanya
 * di sini sengaja ditampilkan sebagai "percobaan", bukan "serangan",
 * supaya nilainya tidak ditafsirkan lebih dari yang ada.
 */
class SecurityMonitoringService
{
    /**
     * Klasifikasi event keamanan. `severity` menentukan warna di UI.
     *
     * - critical: indikasi manipulasi/pemalsuan yang sudah dicegah sistem
     * - warning : aktivitas yang perlu ditinjau manusia
     * - info    : jejak normal, berguna untuk audit
     */
    private const EVENTS = [
        'document.tampered' => [
            'label' => 'Dokumen Dimodifikasi',
            'severity' => 'critical',
            'hint' => 'Berkas berubah setelah diunggah — akses diblokir.',
        ],
        'document.missing' => [
            'label' => 'Dokumen Hilang',
            'severity' => 'critical',
            'hint' => 'Berkas tidak ditemukan di penyimpanan.',
        ],
        'document.reuploaded_after_verified' => [
            'label' => 'Upload Ulang Setelah Verifikasi',
            'severity' => 'warning',
            'hint' => 'Stempel persetujuan dicabut; pendaftar kembali ke antrean.',
        ],
        'identity.drift.detected' => [
            'label' => 'Drift Identitas (NISN/NIK)',
            'severity' => 'critical',
            'hint' => 'Sumber data mengirim NIK/TTL berbeda dari identitas terkunci — sinkron ditolak.',
        ],
        'security.console.attempt' => [
            'label' => 'Percobaan Buka Console',
            'severity' => 'warning',
            'hint' => 'Deterrence client-side — indikasi rasa ingin tahu, bukan bukti serangan.',
        ],
        'auth.otp.failed' => [
            'label' => 'OTP Gagal',
            'severity' => 'warning',
            'hint' => 'Percobaan kode OTP salah (maksimal 5× sebelum kedaluwarsa).',
        ],
        'superadmin.twofa.reset' => [
            'label' => 'Reset 2FA Admin',
            'severity' => 'warning',
            'hint' => 'Akses admin tanpa kode Authenticator — perlu konfirmasi.',
        ],
        'superadmin.verify.global.granted' => [
            'label' => 'Hak Verifikasi Global Diberi',
            'severity' => 'warning',
            'hint' => 'Akun dapat memutuskan seluruh pendaftar lintas sekolah.',
        ],
        'superadmin.verify.global.revoked' => [
            'label' => 'Hak Verifikasi Global Dicabut',
            'severity' => 'info',
            'hint' => 'Akses global dicabut.',
        ],
        'superadmin.admin.created' => [
            'label' => 'Admin Baru Dibuat',
            'severity' => 'info',
            'hint' => 'Akun admin provinsi/kabupaten.',
        ],
    ];

    /**
     * Katalog event + label/severity-nya. Dipakai controller untuk
     * memvalidasi filter, dan dikirim ke UI agar label tidak
     * diduplikasi di frontend.
     *
     * @return array<string, array{label:string, severity:string, hint:string}>
     */
    public static function catalogue(): array
    {
        return self::EVENTS;
    }

    /** Event yang menandakan pemalsuan data — sudah dicegah sistem, wajib dilihat manusia. */
    private const CRITICAL_EVENTS = [
        'document.tampered',
        'document.missing',
        'identity.drift.detected',
    ];

    /**
     * @param  array{filters?: array, per_page?: int}  $options
     */
    public function overview(array $options = []): array
    {
        $perPage = min(max((int) ($options['per_page'] ?? 25), 5), 100);
        $filters = $options['filters'] ?? [];
        $windowDays = (int) ($filters['days'] ?? 30);
        $since = now()->subDays($windowDays);

        return [
            'kpi' => $this->kpi($windowDays),
            'trend' => $this->trend($since),
            'events' => $this->recentEvents($filters, $perPage),
            'actors' => $this->suspectedActors($since),
            'console_reasons' => $this->consoleReasons($since),
            'filters' => $filters + ['days' => $windowDays],
            'meta' => [
                'days' => $windowDays,
                'catalogue' => self::catalogue(),
                'user_agent_limit' => 120,
            ],
        ];
    }

    /**
     * Pecah percobaan console berdasarkan trigger-nya.
     *
     * Ini yang paling bisa ditindaklanjuti: angka total tidak memberi
     * informasi apa pun soal apakah staf sekadar iseng atau seseorang
     * sedang menelusuri data secara sistematis. "context-menu" yang
     * menumpuk dari satu akun hanya berarti klik-kanan berulang — kebiasaan
     * curiosity. "devtools:open" berulang jauh lebih mengkhawatirkan,
     * karena itu deteksi panel yang benar-benar terbuka.
     *
     * @return \\Illuminate\\Support\\Collection<int, array{reason:string,count:int,users:int,last_seen:string}>
     */
    private function consoleReasons(Carbon $since): Collection
    {
        return AuditLog::where('event', 'security.console.attempt')
            ->where('created_at', '>=', $since)
            ->get(['user_id', 'new_values', 'created_at'])
            ->groupBy(fn (AuditLog $row) => $row->new_values['reason'] ?? 'tidak diketahui')
            ->map(fn (Collection $rows, string $reason) => [
                'reason' => $reason,
                'count' => $rows->count(),
                'users' => $rows->pluck('user_id')->filter()->unique()->count(),
                'last_seen' => $rows->max('created_at'),
            ])
            ->sortByDesc('count')
            ->values();
    }

    /** @return array<string,int> */
    private function kpi(int $windowDays): array
    {
        $since = now()->subDays($windowDays);
        $today = now()->startOfDay();
        $last24 = now()->subDay();

        $count = fn (string $event, $from) => AuditLog::where('event', $event)
            ->where('created_at', '>=', $from)
            ->count();

        return [
            'critical' => AuditLog::whereIn('event', self::CRITICAL_EVENTS)
                ->where('created_at', '>=', $since)
                ->count(),
            'console_attempts_24h' => $count('security.console.attempt', $last24),
            'console_attempts_total' => $count('security.console.attempt', $since),
            'otp_failed_24h' => $count('auth.otp.failed', $last24),
            'documents_tampered' => $count('document.tampered', $since),
            'identity_drift' => $count('identity.drift.detected', $since),
            'reupload_after_verified' => $count('document.reuploaded_after_verified', $since),
            'today' => AuditLog::whereIn('event', array_keys(self::EVENTS))->where('created_at', '>=', $today)->count(),
        ];
    }

    /**
     * Deret harian 14 hari terakhir — cukup untuk melihat pola tanpa
     * membanjiri tabel. Nol di hari tanpa laporan.
     *
     * @return array<int, array{date:string,critical:int,warning:int,info:int,total:int}>
     */
    private function trend(Carbon $since): array
    {
        $start = $since->copy()->startOfDay();
        $events = self::EVENTS;
        $meta = collect($events)->map(fn ($e, $name) => $name.':'.$e['severity'])->all();

        $rows = AuditLog::whereIn('event', array_keys($events))
            ->where('created_at', '>=', $start)
            ->get(['event', 'created_at']);

        $buckets = [];
        for ($i = 0; $i < 14; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $buckets[$date] = ['date' => $date, 'critical' => 0, 'warning' => 0, 'info' => 0, 'total' => 0];
        }

        foreach ($rows as $row) {
            $date = Carbon::parse($row->created_at)->toDateString();
            if (! isset($buckets[$date])) {
                continue;
            }
            $severity = $meta[$row->event] ?? 'info';
            $buckets[$date][$severity]++;
            $buckets[$date]['total']++;
        }

        return array_values($buckets);
    }

    /**
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    private function recentEvents(array $filters, int $perPage)
    {
        $query = AuditLog::with('user:id,name,email,role')
            ->whereIn('event', array_keys(self::EVENTS))
            ->latest('id');

        if (! empty($filters['severity'])) {
            $wanted = collect(self::EVENTS)
                ->filter(fn ($e) => $e['severity'] === $filters['severity'])
                ->keys()
                ->all();

            $query->whereIn('event', $wanted ?: ['__none__']);
        }

        if (! empty($filters['event'])) {
            if (! array_key_exists($filters['event'], self::EVENTS)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('event', $filters['event']);
            }
        }

        if (! empty($filters['days'])) {
            $query->where('created_at', '>=', now()->subDays((int) $filters['days']));
        }

        if (! empty($filters['q'])) {
            $needle = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($needle) {
                $q->where('ip_address', 'like', $needle)
                    ->orWhere('request_path', 'like', $needle)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $needle)->orWhere('email', 'like', $needle));
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Siapa yang paling sering memicu event keamanan. Membantu menjawab
     * pertanyaan "apakah ini satu user yang bermasalah, atau konfigurasi
     * sistem yang salah?".
     *
     * @return \Illuminate\Support\Collection<int, array>
     */
    private function suspectedActors(Carbon $since): Collection
    {
        $groups = AuditLog::whereIn('event', array_keys(self::EVENTS))
            ->where('created_at', '>=', $since)
            ->get(['user_id', 'ip_address', 'event', 'created_at'])
            ->groupBy('user_id');

        // Satu query untuk semua akun yang muncul — bukan find() per baris.
        $users = User::whereIn('id', $groups->keys()->filter()->all())
            ->get(['id', 'name', 'role'])
            ->keyBy('id');

        return $groups->map(fn (Collection $rows, $userId) => [
            'user_id' => $userId,
            'name' => $userId ? ($users[$userId]->name ?? 'Akun terhapus') : 'Tamu (tanpa login)',
            'role' => $userId ? ($users[$userId]->role ?? '—') : 'guest',
            'total' => $rows->count(),
            'critical' => $rows->filter(fn ($r) => in_array($r->event, self::CRITICAL_EVENTS, true))->count(),
            'ips' => $rows->pluck('ip_address')->filter()->unique()->take(3)->values(),
            'last_seen' => $rows->max('created_at'),
        ])
            ->sortByDesc('total')
            ->take(8)
            ->values();
    }

    /**
     * Ringkasan integritas dokumen — menggambarkan "kondisi dokumen sekarang",
     * terpisah dari jejak peristiwanya.
     */
    public function integritySummary(): array
    {
        return [
            'tracked' => Document::whereNotNull('sha256')->count(),
            'untracked' => Document::whereNull('sha256')->count(),
            'verified_pinned' => Document::whereNotNull('verified_sha256')->count(),
            'bound_identities' => Student::whereNotNull('identity_hash')->count(),
            'students' => Student::count(),
        ];
    }
}
