import { Head, Link } from '@inertiajs/react';

const year = new Date().getFullYear();

const HOW = [
    { n: 1, title: 'Masuk NISN', desc: 'Verifikasi NISN lewat kanal resmi, tanpa isi ulang biodata.' },
    { n: 2, title: 'Pilih Jalur', desc: 'Domisili, afirmasi, prestasi, atau mutasi — sesuai ketentuan.' },
    { n: 3, title: 'Pilih Sekolah', desc: 'Lihat kuota, daya tampung, dan lokasi tiap sekolah.' },
    { n: 4, title: 'Submit & Pantau', desc: 'Upload dokumen, kirim, lalu pantau status sampai pengumuman.' },
];

const PATHS = [
    { code: 'zonasi', name: 'Zonasi / Domisili', desc: 'Domisili sesuai radius dan wilayah sekolah.', icon: '◉' },
    { code: 'afirmasi', name: 'Afirmasi', desc: 'Peserta dari keluarga prasejahtera dan berkebutuhan khusus.', icon: '★' },
    { code: 'prestasi', name: 'Prestasi', desc: 'Rapor, lomba, dan capaian akademik lainnya.', icon: '✦' },
    { code: 'mutasi', name: 'Mutasi', desc: 'Anak pindah tugas orang tua/wali atau perpindahan domisili.', icon: '⇄' },
];

export default function Landing({ name, year: periodYear, period, stats }) {
    return (
        <>
            <Head title="SPMB JABAR — Satu NISN, Satu Data, Satu Layanan" />
            <div className="min-h-screen bg-surface text-ink flex flex-col">
                {/* Top nav */}
                <header className="bg-surface-container-low border-b border-outline-variant">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="size-9 rounded-8 bg-brand-700 text-white flex items-center justify-center font-extrabold">
                                S
                            </span>
                            <span className="font-extrabold text-cemara leading-none">SPMB JABAR</span>
                        </div>
                        <nav className="flex items-center gap-3">
                            <Link
                                href="/auth/nisn"
                                className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800"
                            >
                                Daftar SPMB
                            </Link>
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-ink-soft hover:text-brand-700"
                            >
                                Masuk Staf
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage:
                                'linear-gradient(90deg, #0d5c3a 1px, transparent 1px), linear-gradient(0deg, #0d5c3a 1px, transparent 1px)',
                            backgroundSize: '56px 56px',
                        }}
                    />
                    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                            Satu NISN · Satu Data · Satu Layanan
                        </p>
                        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-cemara sm:text-5xl">
                            SPMB JAWA BARAT
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-soft sm:text-lg">
                            Sistem Penerimaan Murid Baru terintegrasi Provinsi Jawa Barat.
                            Daftar dengan NISN, data terisi otomatis dari sumber resmi,
                            dan pantau prosesnya sampai pengumuman.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/auth/nisn"
                                className="w-full sm:w-auto rounded-8 bg-brand-700 px-6 py-3 text-sm font-bold text-white hover:bg-brand-800"
                            >
                                Daftar Sekarang
                            </Link>
                            <a
                                href="#cara-daftar"
                                className="w-full sm:w-auto rounded-8 border border-outline-variant px-6 py-3 text-sm font-semibold text-ink hover:border-brand-700"
                            >
                                Lihat Cara Daftar
                            </a>
                        </div>

                        {/* Stats */}
                        <dl className="mx-auto mt-12 grid w-full max-w-3xl grid-cols-3 gap-4">
                            <Stat value={stats?.schools ?? 0} label="Sekolah Peserta" />
                            <Stat value={stats?.paths ?? 0} label="Jalur Penerimaan" />
                            <Stat value={formatNumber(stats?.kuota ?? 0)} label="Total Kuota" />
                        </dl>

                        {period && (
                            <p className="mt-6 text-xs text-ink-faint">
                                Periode pendaftaran {periodYear ?? ''}:{' '}
                                <span className="font-semibold">{fmtDate(period.opens)}</span> —{' '}
                                <span className="font-semibold">{fmtDate(period.closes)}</span>
                            </p>
                        )}
                    </div>
                </section>

                {/* How to register */}
                <section id="cara-daftar" className="border-t border-outline-variant bg-surface-container-low/60">
                    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Cara Daftar</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-cemara sm:text-3xl">
                                Empat Langkah Sederhana
                            </h2>
                        </div>
                        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {HOW.map((s) => (
                                <div key={s.n} className="rounded-8 border border-outline-variant bg-white p-5">
                                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                                        {s.n}
                                    </span>
                                    <h3 className="mt-3 font-bold text-ink">{s.title}</h3>
                                    <p className="mt-1 text-sm text-ink-soft">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Admission paths */}
                <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 w-full">
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Jalur Penerimaan</p>
                        <h2 className="mt-2 text-2xl font-extrabold text-cemara sm:text-3xl">
                            Pilih Jalur yang Sesuai
                        </h2>
                    </div>
                    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {PATHS.map((p) => (
                            <div key={p.code} className="rounded-8 border border-outline-variant bg-surface-container-low p-5">
                                <span className="text-xl">{p.icon}</span>
                                <h3 className="mt-2 font-bold text-ink">{p.name}</h3>
                                <p className="mt-1 text-sm text-ink-soft">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <Link
                            href="/auth/nisn"
                            className="rounded-8 bg-brand-700 px-6 py-3 text-sm font-bold text-white hover:bg-brand-800"
                        >
                            Mulai Pendaftaran
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-2 text-xs text-ink-faint sm:flex-row">
                        <span>© {year} Dinas Pendidikan Provinsi Jawa Barat — SPMB Terintegrasi</span>
                        <span className="text-ink-faint">
                            Data pribadi Anda dilindungi sesuai ketentuan yang berlaku.
                        </span>
                    </div>
                </footer>
            </div>
        </>
    );
}

function Stat({ value, label }) {
    return (
        <div className="rounded-8 border border-outline-variant bg-white px-3 py-4">
            <dt className="sr-only">{label}</dt>
            <dd className="text-2xl font-extrabold text-cemara sm:text-3xl">{value}</dd>
            <dd className="mt-1 text-xs font-medium text-ink-faint">{label}</dd>
        </div>
    );
}

function formatNumber(n) {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}

function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? '—'
        : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}