import { Head, Link, useForm } from '@inertiajs/react';

const year = new Date().getFullYear();

const STEPS = [
    {
        n: '01',
        title: 'Verifikasi NISN',
        desc: 'Kunci masuk tanpa isi ulang biodata — data ditarik langsung dari kanal resmi.',
    },
    {
        n: '02',
        title: 'Pilih Jalur & Sekolah',
        desc: 'Zonasi, afirmasi, prestasi, atau perpindahan — disesuaikan kuota dan lokasi.',
    },
    {
        n: '03',
        title: 'Unggah Dokumen',
        desc: 'Dokumen wajib sesuai jalur; diverifikasi operator sebelum seleksi.',
    },
    {
        n: '04',
        title: 'Submit & Pantau',
        desc: 'Nomor pendaftaran diterbitkan; pantau status sampai pengumuman.',
    },
];

const PATHS = [
    {
        code: 'zonasi',
        name: 'Zonasi / Domisili',
        desc: 'Domisili sesuai radius dan wilayah sekolah.',
        docs: ['Kartu Keluarga', 'Ijazah'],
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm4.5 0c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        ),
    },
    {
        code: 'afirmasi',
        name: 'Afirmasi',
        desc: 'Keluarga prasejahtera dan peserta berkebutuhan khusus.',
        docs: ['Kartu Keluarga', 'Sertifikat Prestasi'],
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        ),
    },
    {
        code: 'prestasi',
        name: 'Prestasi',
        desc: 'Capaian akademik, rapor, dan kejuaraan.',
        docs: ['Kartu Keluarga', 'KIP/PKH', 'SKTM'],
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        ),
    },
    {
        code: 'perpindahan',
        name: 'Perpindahan Tugas',
        desc: 'Anak pindah tugas orang tua/wali atau perpindahan domisili.',
        docs: ['Kartu Keluarga', 'Surat Mutasi'],
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        ),
    },
];

export default function Landing({ year: periodYear, period, stats }) {
    const { data, setData, get, processing } = useForm({
        no_pendaftaran: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        get('/public/announcement', {
            data: { no_pendaftaran: data.no_pendaftaran },
        });
    };

    return (
        <>
            <Head title="SPMB JABAR — Satu NISN, Satu Data, Satu Layanan" />
            <div className="flex min-h-screen flex-col bg-surface text-ink">
                {/* Top nav */}
                <header className="sticky top-0 z-50 border-b border-outline-variant bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-3">
                            <img
                                src="/images/disdik-jabar.png"
                                alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                                className="size-11 object-contain sm:size-12"
                            />
                            <div className="flex flex-col leading-none">
                                <span className="text-lg font-extrabold tracking-tight text-cemara sm:text-xl">
                                    SPMB JABAR
                                </span>
                                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                                    Provinsi Jawa Barat
                                </span>
                            </div>
                        </Link>
                        <nav className="flex items-center gap-6">
                            <div className="hidden items-center gap-6 lg:flex">
                                <a href="#cara-daftar" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Panduan
                                </a>
                                <Link href="/public/directory" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Direktori Sekolah
                                </Link>
                                <Link href="/public/announcement" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Pengumuman
                                </Link>
                                <Link href="/docs" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Dokumentasi
                                </Link>
                            </div>
                            <Link href="/login" className="btn-outline whitespace-nowrap">
                                Masuk
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero — editorial split */}
                <section className="border-b border-outline-variant bg-white">
                    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:py-24 lg:px-8">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                                <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                                Sistem berjalan normal · Periode {periodYear}
                            </p>
                            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight text-cemara text-balance sm:text-5xl lg:text-6xl">
                                Penerimaan Murid Baru <span className="text-brand-800">Jawa Barat</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                                Portal terpadu SPMB se-Jawa Barat. Transparan, cepat, dan akuntabel —
                                satu NISN untuk seluruh proses, dari pendaftaran sampai pengumuman.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link href="/login" className="btn-primary px-8 py-3.5">
                                    Mulai Pendaftaran
                                </Link>
                                <a href="#cara-daftar" className="btn-outline px-8 py-3.5">
                                    Lihat Panduan
                                </a>
                            </div>
                        </div>

                        {/* Panel periode — info live, bukan deretan kartu statistik */}
                        <aside className="rounded-8 border border-outline bg-surface p-7">
                            <div className="flex items-baseline justify-between gap-4">
                                <h2 className="text-sm font-extrabold uppercase tracking-wider text-ink">
                                    Periode Aktif
                                </h2>
                                <span className="font-mono text-xs font-bold text-brand-700">{period?.year ?? year}</span>
                            </div>
                            <dl className="mt-6 divide-y divide-outline-variant">
                                <div className="flex items-baseline justify-between gap-4 py-3.5">
                                    <dt className="text-sm text-ink-soft">Pendaftaran</dt>
                                    <dd className="text-right text-sm font-bold text-ink">
                                        {fmtDate(period?.registration_start)} — {fmtDate(period?.registration_end)}
                                    </dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3.5">
                                    <dt className="text-sm text-ink-soft">Jalur aktif</dt>
                                    <dd className="text-right text-2xl font-extrabold tabular-nums tracking-tight text-cemara">{formatNumber(stats?.paths ?? 0)}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3.5">
                                    <dt className="text-sm text-ink-soft">Sekolah peserta</dt>
                                    <dd className="text-right text-2xl font-extrabold tabular-nums tracking-tight text-cemara">{formatNumber(stats?.schools ?? 0)}</dd>
                                </div>
                                <div className="flex items-baseline justify-between gap-4 py-3.5">
                                    <dt className="text-sm text-ink-soft">Total kuota</dt>
                                    <dd className="text-right text-2xl font-extrabold tabular-nums tracking-tight text-brand-800">{formatNumber(stats?.kuota ?? 0)}</dd>
                                </div>
                            </dl>
                            <p className="mt-4 text-xs leading-relaxed text-ink-faint">
                                Ringkasan diambil langsung dari sistem berjalan. Rincian sekolah
                                per wilayah tersedia di direktori.
                            </p>
                        </aside>
                    </div>

                    {/* Cek hasil — band terpisah agar hero tetap bersih */}
                    <div className="border-t border-outline-variant">
                        <form
                            onSubmit={handleSearch}
                            className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:px-8"
                        >
                            <label htmlFor="no-pendaftaran" className="shrink-0 text-sm font-bold text-ink">
                                Cek Hasil Seleksi
                            </label>
                            <input
                                id="no-pendaftaran"
                                type="text"
                                value={data.no_pendaftaran}
                                onChange={(e) => setData('no_pendaftaran', e.target.value)}
                                className="flex-1 rounded-8 border border-outline bg-surface px-4 py-3 text-base outline-none transition-colors placeholder:text-ink-faint focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                                placeholder="Masukkan No. Pendaftaran atau NISN…"
                                required
                            />
                            <button type="submit" disabled={processing} className="btn-primary px-7">
                                {processing ? 'Mencari…' : 'Cari'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* How to register — editorial timeline */}
                <section id="cara-daftar" className="border-b border-outline-variant">
                    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            <p className="micro text-brand-700">Alur Pendaftaran</p>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-cemara text-balance sm:text-4xl">
                                Dari NISN hingga pengumuman, tanpa bolak-balik.
                            </h2>
                            <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
                                Empat langkah sederhana yang sama untuk semua calon siswa.
                                Setiap tahap tercatat, sehingga status selalu bisa dipantau.
                            </p>
                            <Link href="/docs" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800">
                                Baca dokumentasi lengkap →
                            </Link>
                        </div>

                        <div>
                            <ol className="steps">
                                {STEPS.map((s, i) => (
                                    <li key={s.n} className="flex gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="grid size-12 shrink-0 place-items-center rounded-full border border-outline bg-white font-mono text-sm font-extrabold text-brand-700">
                                                {s.n}
                                            </span>
                                            {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-outline" aria-hidden="true" />}
                                        </div>
                                        <div className="pb-10">
                                            <h3 className="text-lg font-bold tracking-tight text-ink">{s.title}</h3>
                                            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>

                {/* Admission paths — asymmetric, kartu fitur gelap */}
                <section className="bg-surface">
                    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-xl">
                                <p className="micro text-brand-700">Opsi Jalur</p>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-cemara text-balance sm:text-4xl">
                                    Empat jalur, sesuai kondisi Anda.
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                                Setiap jalur punya persyaratan dokumen tersendiri. Detail lengkap ada
                                di dokumentasi sistem.
                            </p>
                        </div>

                        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Featured dark panel */}
                            <div className="flex flex-col justify-between rounded-8 bg-cemara p-8 text-white sm:p-10">
                                <div>
                                    <svg className="size-7 text-brand-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        {PATHS[0].icon}
                                    </svg>
                                    <h3 className="mt-6 text-2xl font-extrabold tracking-tight">{PATHS[0].name}</h3>
                                    <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">{PATHS[0].desc}</p>
                                </div>
                                <div className="mt-10 flex flex-wrap items-center gap-2">
                                    {PATHS[0].docs.map((d) => (
                                        <span key={d} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Three light panels */}
                            <div className="grid gap-5 sm:grid-cols-2">
                                {PATHS.slice(1).map((p) => (
                                    <div key={p.code} className="flex flex-col justify-between rounded-8 border border-outline-variant bg-white p-6 transition-colors hover:border-brand-400">
                                        <div>
                                            <svg className="size-6 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                {p.icon}
                                            </svg>
                                            <h3 className="mt-4 text-base font-bold tracking-tight text-ink">{p.name}</h3>
                                            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
                                        </div>
                                        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-faint">
                                            {p.docs.length} dokumen wajib
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm leading-relaxed text-ink-soft">
                                Tidak yakin jalur mana yang tepat? Baca ketentuan detail di dokumentasi.
                            </p>
                            <Link href="/docs#jalur" className="btn-outline shrink-0 px-7">
                                Cek Persyaratan
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA band */}
                <section className="border-t border-outline-variant bg-brand-800">
                    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Siap mendaftar?</h2>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-200">
                                Login dengan NISN untuk memulai, atau jelajahi dokumentasi termasuk akun demo setiap peran.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                            <Link href="/login" className="inline-flex items-center justify-center rounded-8 bg-white px-8 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50">
                                Mulai Pendaftaran
                            </Link>
                            <Link href="/docs" className="inline-flex items-center justify-center rounded-8 border border-white/30 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                                Buka Dokumentasi
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-outline-variant bg-white">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-xs text-ink-faint sm:flex-row sm:px-6 lg:px-8">
                        <div className="text-center sm:text-left">
                            © {year} Dinas Pendidikan Provinsi Jawa Barat — SPMB Terintegrasi
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-semibold">
                            <Link href="/public/directory" className="transition-colors hover:text-brand-700">Direktori</Link>
                            <Link href="/public/downloads" className="transition-colors hover:text-brand-700">Unduhan</Link>
                            <Link href="/public/announcement" className="transition-colors hover:text-brand-700">Pengumuman</Link>
                            <Link href="/docs" className="transition-colors hover:text-brand-700">Dokumentasi</Link>
                        </div>
                        <div className="text-center sm:text-right">
                            Data pribadi Anda dilindungi sesuai ketentuan yang berlaku.
                        </div>
                    </div>
                </footer>
            </div>
        </>
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
        : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}