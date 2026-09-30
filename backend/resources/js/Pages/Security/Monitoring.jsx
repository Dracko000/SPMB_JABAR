import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const SEVERITY = {
    critical: {
        label: 'Kritis',
        chip: 'bg-error-container text-error ring-error/20',
        dot: 'bg-error',
        bar: 'bg-error',
    },
    warning: {
        label: 'Perlu Ditinjau',
        chip: 'bg-warn-100 text-warn-800 ring-warn-200',
        dot: 'bg-warn-500',
        bar: 'bg-warn-500',
    },
    info: {
        label: 'Informasi',
        chip: 'bg-surface-container text-ink-soft ring-outline',
        dot: 'bg-brand-500',
        bar: 'bg-brand-500',
    },
};

/** Alasan yang dikirim consoleGuard.js — cermin, jangan sampai beda label. */
const REASON_LABELS = {
    'shortcut:f12': { label: 'Pintasan F12' },
    'shortcut:inspect': { label: 'Ctrl+Shift+I / Cmd+Opt+I' },
    'context-menu': { label: 'Klik Kanan' },
    'devtools:open': { label: 'Panel Terbuka' },
};

const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin_provinsi: 'Admin Provinsi',
    admin_kabkota: 'Admin Kab/Kota',
    operator_sekolah: 'Operator Sekolah',
    verifikator: 'Verifikator',
    operator_smp: 'Operator SMP',
    pendaftar: 'Peserta',
    guest: 'Tamu',
};

function formatWhen(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatClock(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Stat({ label, value, hint, severity }) {
    const tone = severity ? SEVERITY[severity] : null;
    return (
        <div className="card p-5">
            <div className="flex items-center gap-2">
                {tone && <span className={`size-2 rounded-full ${tone.dot}`} aria-hidden="true" />}
                <p className="kpi-label">{label}</p>
            </div>
            <p className={`mt-2 text-3xl font-extrabold tracking-tight ${severity === 'critical' && value > 0 ? 'text-error' : 'text-ink'}`}>
                {value}
            </p>
            {hint && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{hint}</p>}
        </div>
    );
}

function TrendChart({ trend }) {
    const max = Math.max(...trend.map((d) => d.total), 1);
    const peak = trend.reduce((a, b) => (b.total > a.total ? b : a), trend[0]);

    return (
        <div className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-ink">Tren 14 Hari Terakhir</h2>
                <div className="flex items-center gap-4 text-[11px] font-semibold text-ink-soft">
                    {Object.entries(SEVERITY).map(([key, s]) => (
                        <span key={key} className="inline-flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex h-40 items-end gap-1.5" role="img" aria-label="Tren event keamanan 14 hari terakhir">
                {trend.map((d) => {
                    const heightPct = (d.total / max) * 100;
                    const critPct = d.total ? (d.critical / d.total) * heightPct : 0;
                    const warnPct = d.total ? (d.warning / d.total) * heightPct : 0;
                    const infoPct = Math.max(heightPct - critPct - warnPct, 0);
                    const isPeak = d.date === peak.date && d.total > 0;

                    return (
                        <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.total} event`}>
                            <div className="flex h-full flex-col justify-end gap-px">
                                <div className="w-full rounded-t bg-error" style={{ height: `${critPct}%` }} />
                                <div className="w-full bg-warn-500" style={{ height: `${warnPct}%` }} />
                                <div className="w-full rounded-b bg-brand-500" style={{ height: `${infoPct}%` }} />
                            </div>
                            {isPeak && (
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-ink-soft">
                                    {d.total}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 flex justify-between text-[10px] font-medium text-ink-faint">
                <span>{trend[0]?.date}</span>
                <span>{trend[trend.length - 1]?.date}</span>
            </div>
        </div>
    );
}

export default function SecurityMonitoring({ kpi, trend, events, actors, meta, integrity, filters, console_reasons = [] }) {
    const [localFilters, setLocalFilters] = useState({
        severity: filters?.severity ?? '',
        event: filters?.event ?? '',
        days: String(filters?.days ?? meta.days),
        q: filters?.q ?? '',
    });
    const [openEvent, setOpenEvent] = useState(null);

    const apply = (patch) => {
        const next = { ...localFilters, ...patch };
        setLocalFilters(next);
        router.get('/monitoring', Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '')), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const reset = () => {
        setLocalFilters({ severity: '', event: '', days: '30', q: '' });
        router.get('/monitoring', {}, { preserveState: true, preserveScroll: true });
    };

    const hasFilter = Boolean(filters?.severity || filters?.event || filters?.q);

    const maxBar = useMemo(
        () => Math.max(...(actors ?? []).map((a) => a.total), 1),
        [actors]
    );

    return (
        <AppLayout>
            <Head title="Monitoring Keamanan — SPMB JABAR" />
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="micro text-brand-700">Observasi</p>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-cemara sm:text-3xl">
                            Monitoring Keamanan
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                            Log audit yang tidak pernah dibaca tidak berguna. Halaman ini mengubah
                            jejak keamanan menjadi tren, anomali terbaru, dan pelaku yang perlu ditinjau.
                        </p>
                    </div>
                    <Link href="/superadmin" className="btn-outline shrink-0">
                        Panel Super Admin
                    </Link>
                </div>

                {/* KPI */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="Anomali Kritis"
                        value={kpi.critical}
                        severity={kpi.critical > 0 ? 'critical' : null}
                        hint="Dokumen diubah/hilang atau drift identitas — sistem sudah mencegah, perlu ditinjau"
                    />
                    <Stat
                        label="Percobaan Console (24 jam)"
                        value={kpi.console_attempts_24h}
                        hint={`Total ${kpi.console_attempts_total} dalam ${meta.days} hari terakhir`}
                    />
                    <Stat
                        label="OTP Gagal (24 jam)"
                        value={kpi.otp_failed_24h}
                        hint="Percobaan kode OTP salah"
                    />
                    <Stat label="Event Hari Ini" value={kpi.today} hint="Seluruh event keamanan yang tercatat" />
                </div>

                {/* Pemecahan alasan console — ini yang paling actionable dari deterrent */}
                {console_reasons.length > 0 && (
                    <div className="card mt-6 p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className="text-base font-extrabold tracking-tight text-ink">
                                Pemecahan Percobaan Console
                            </h2>
                            <p className="text-xs text-ink-faint">{meta.days} hari terakhir</p>
                        </div>
                        <p className="mt-1 text-xs text-ink-faint">
                            Angka total tidak membedakan staf yang sekadar iseng dari yang sengaja menelusuri.
                            Pecahan per trigger membuatnya jelas.
                        </p>
                        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {console_reasons.map((r) => (
                                <li key={r.reason} className="rounded-8 bg-surface-container-low p-4">
                                        <p className="text-xs font-bold text-ink">
                                            {REASON_LABELS[r.reason]?.label ?? r.reason}
                                        </p>
                                        <p className="mt-1 font-mono text-[10px] text-ink-faint">{r.reason}</p>
                                        <p className="mt-3 text-2xl font-extrabold tabular-nums text-cemara">{r.count}</p>
                                        <p className="mt-0.5 text-xs text-ink-faint">
                                            {r.users > 0
                                                ? `${r.users} akun · terakhir ${formatWhen(r.last_seen)}`
                                                : `terakhir ${formatWhen(r.last_seen)}`}
                                        </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tren + integritas */}
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <TrendChart trend={trend} />
                    </div>
                    <div className="card p-6">
                        <h2 className="text-base font-extrabold tracking-tight text-ink">Kondisi Integritas</h2>
                        <p className="mt-1 text-xs text-ink-faint">Snapshot saat ini, terpisah dari jejak peristiwanya.</p>
                        <dl className="mt-5 space-y-3">
                            {[
                                {
                                    label: 'Dokumen ter fingerprint',
                                    value: integrity.tracked,
                                    sub: `${integrity.untracked} dokumen legacy belum punya hash`,
                                },
                                {
                                    label: 'Hash verifikasi terkunci',
                                    value: integrity.verified_pinned,
                                    sub: 'Dokumen yang sudah disetujui & dikunci',
                                },
                                {
                                    label: 'Identitas terkunci',
                                    value: integrity.bound_identities,
                                    sub: `dari ${integrity.students} siswa — NISN+NIK+TTL di-hash`,
                                },
                            ].map((row) => (
                                <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <dt className="text-sm font-semibold text-ink">{row.label}</dt>
                                        <dd className="mt-0.5 text-xs text-ink-faint">{row.sub}</dd>
                                    </div>
                                    <span className="text-xl font-extrabold tabular-nums text-cemara">{row.value}</span>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* Pelaku */}
                <div className="card mt-6 p-6">
                    <h2 className="text-base font-extrabold tracking-tight text-ink">Pelaku Perlu Ditinjau</h2>
                    <p className="mt-1 text-xs text-ink-faint">
                        Dikelompokkan per akun untuk membedakan satu user yang bermasalah dari masalah konfigurasi.
                    </p>
                    {actors.length === 0 ? (
                        <p className="mt-5 rounded-8 bg-surface-container-low px-4 py-6 text-center text-sm text-ink-faint">
                            Belum ada event keamanan dalam {meta.days} hari terakhir.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-3">
                            {actors.map((a) => (
                                <li key={a.user_id ?? 'guest'} className="flex items-center gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-ink">{a.name}</p>
                                        <p className="truncate text-xs text-ink-faint">
                                            {ROLE_LABELS[a.role] ?? a.role} · terakhir {formatWhen(a.last_seen)}
                                            {a.ips.length > 0 && ` · IP ${a.ips.join(', ')}`}
                                        </p>
                                    </div>
                                    {a.critical > 0 && (
                                        <span className="shrink-0 rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-bold text-error ring-1 ring-inset ring-error/20">
                                            {a.critical} kritis
                                        </span>
                                    )}
                                    <div className="w-24 shrink-0">
                                        <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                                            <div
                                                className={`h-full rounded-full ${a.critical > 0 ? 'bg-error' : 'bg-brand-500'}`}
                                                style={{ width: `${(a.total / maxBar) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="w-6 shrink-0 text-right text-sm font-extrabold tabular-nums text-ink">
                                        {a.total}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Filter + daftar event */}
                <div className="card mt-6 overflow-hidden">
                    <div className="border-b border-outline-variant px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-base font-extrabold tracking-tight text-ink">Anomali Terbaru</h2>
                            {hasFilter && (
                                <button onClick={reset} className="btn-ghost text-xs">
                                    Reset filter
                                </button>
                            )}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label htmlFor="f-sev" className="label text-xs">Tingkat</label>
                                <select
                                    id="f-sev"
                                    className="input py-2 text-sm"
                                    value={localFilters.severity}
                                    onChange={(e) => apply({ severity: e.target.value })}
                                >
                                    <option value="">Semua</option>
                                    <option value="critical">Kritis</option>
                                    <option value="warning">Perlu Ditinjau</option>
                                    <option value="info">Informasi</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="f-event" className="label text-xs">Jenis Event</label>
                                <select
                                    id="f-event"
                                    className="input py-2 text-sm"
                                    value={localFilters.event}
                                    onChange={(e) => apply({ event: e.target.value })}
                                >
                                    <option value="">Semua jenis</option>
                                    {Object.entries(meta.catalogue).map(([key, c]) => (
                                        <option key={key} value={key}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="f-days" className="label text-xs">Rentang</label>
                                <select
                                    id="f-days"
                                    className="input py-2 text-sm"
                                    value={localFilters.days}
                                    onChange={(e) => apply({ days: e.target.value })}
                                >
                                    <option value="7">7 hari</option>
                                    <option value="30">30 hari</option>
                                    <option value="90">90 hari</option>
                                    <option value="365">1 tahun</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="f-q" className="label text-xs">Cari (nama/email/IP)</label>
                                <input
                                    id="f-q"
                                    type="search"
                                    className="input py-2 text-sm"
                                    placeholder="cth: 10.9.1.5"
                                    defaultValue={localFilters.q}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') apply({ q: e.currentTarget.value });
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value !== localFilters.q) apply({ q: e.target.value });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {events.data.length === 0 ? (
                        <p className="px-6 py-12 text-center text-sm text-ink-faint">
                            Tidak ada event yang cocok dengan filter.
                        </p>
                    ) : (
                        <ul className="divide-y divide-outline-variant">
                            {events.data.map((row) => {
                                const cat = meta.catalogue[row.event] ?? { label: row.event, severity: 'info', hint: '' };
                                const tone = SEVERITY[cat.severity] ?? SEVERITY.info;
                                const isOpen = openEvent === row.id;
                                const details = row.new_values ?? {};

                                return (
                                    <li key={row.id}>
                                        <button
                                            onClick={() => setOpenEvent(isOpen ? null : row.id)}
                                            className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-surface-container-low"
                                        >
                                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-bold text-ink">{cat.label}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${tone.chip}`}>
                                                        {tone.label}
                                                    </span>
                                                </span>
                                                <span className="mt-1 block truncate text-xs text-ink-faint">
                                                    {row.user
                                                        ? `${row.user.name} · ${ROLE_LABELS[row.user.role] ?? row.user.role}`
                                                        : 'Tamu (tanpa login)'}
                                                    {row.ip_address && ` · ${row.ip_address}`}
                                                    {row.request_path && ` · ${row.request_path}`}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-right">
                                                <span className="block text-xs font-semibold text-ink-soft">{formatWhen(row.created_at)}</span>
                                                <span className="block font-mono text-[10px] text-ink-faint">{row.event}</span>
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="border-t border-outline-variant bg-surface-container-low px-6 py-4">
                                                <p className="text-xs leading-relaxed text-ink-soft">{cat.hint}</p>
                                                <p className="mt-3 text-xs font-bold text-ink">Waktu lengkap</p>
                                                <p className="font-mono text-xs text-ink-soft">{formatClock(row.created_at)}</p>

                                                <p className="mt-4 text-xs font-bold text-ink">Detail</p>
                                                <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                                                    {Object.entries(details).map(([k, v]) => (
                                                        <div key={k} className="flex min-w-0 items-baseline gap-2 text-xs">
                                                            <dt className="shrink-0 font-semibold text-ink-faint">{k}:</dt>
                                                            <dd className="min-w-0 truncate font-mono text-ink-soft">
                                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                            </dd>
                                                        </div>
                                                    ))}
                                                </dl>

                                                {row.user_agent && (
                                                    <>
                                                        <p className="mt-4 text-xs font-bold text-ink">User agent</p>
                                                        <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-ink-faint">
                                                            {row.user_agent.slice(0, meta.user_agent_limit)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {events.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-outline-variant px-6 py-3">
                            <p className="text-xs text-ink-faint">
                                Halaman {events.current_page} dari {events.last_page} · {events.total} event
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={events.current_page <= 1}
                                    onClick={() => router.get('/monitoring', { ...filters, page: events.current_page - 1 }, { preserveScroll: true })}
                                    className="rounded-8 border border-outline bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-brand-700 disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    disabled={events.current_page >= events.last_page}
                                    onClick={() => router.get('/monitoring', { ...filters, page: events.current_page + 1 }, { preserveScroll: true })}
                                    className="rounded-8 border border-outline bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-brand-700 disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-xs leading-relaxed text-ink-faint">
                    Angka <strong>percobaan console</strong> sengaja ditampilkan sebagai sinyal rasa ingin tahu,
                    bukan serangan: browser tetap bisa dibuka lewat cara lain, jadi jumlah ini tidak pernah
                    nol. Yang justru bernilai adalah <strong>anomali kritis</strong> — dokumen dimodifikasi atau
                    identitas berubah — karena itu menunjukkan pemalsuan data, dan sistem sudah mencegahnya
                    sebelum seleksi.
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                    Butuh mengelola akun admin?{' '}
                    <Link href="/superadmin" className="font-semibold text-brand-700 hover:text-brand-800">
                        Buka Panel Super Admin
                    </Link>
                    .
                </p>
            </div>
        </AppLayout>
    );
}
