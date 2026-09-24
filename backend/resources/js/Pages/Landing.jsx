import { Head, Link, useForm } from '@inertiajs/react';
import StatCard from '../Components/StatCard';

const year = new Date().getFullYear();

const HOW = [
    { n: 1, title: 'Masuk NISN', desc: 'Verifikasi NISN lewat kanal resmi, tanpa isi ulang biodata.' },
    { n: 2, title: 'Pilih Jalur', desc: 'Domisili, afirmasi, prestasi, atau mutasi — sesuai ketentuan.' },
    { n: 3, title: 'Pilih Sekolah', desc: 'Lihat kuota, daya tampung, dan lokasi tiap sekolah.' },
    { n: 4, title: 'Submit & Pantau', desc: 'Upload dokumen, kirim, lalu pantau status sampai pengumuman.' },
];

const PATHS = [
    {
        code: 'zonasi',
        name: 'Zonasi / Domisili',
        desc: 'Domisili sesuai radius dan wilayah sekolah.',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm4.5 0c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        ),
    },
    {
        code: 'afirmasi',
        name: 'Afirmasi',
        desc: 'Peserta dari keluarga prasejahtera dan berkebutuhan khusus.',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        ),
    },
    {
        code: 'prestasi',
        name: 'Prestasi',
        desc: 'Rapor, lomba, dan capaian akademik lainnya.',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        ),
    },
    {
        code: 'mutasi',
        name: 'Mutasi',
        desc: 'Anak pindah tugas orang tua/wali atau perpindahan domisili.',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        ),
    },
];

export default function Landing({ name, year: periodYear, period, stats }) {
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
                                <Link href="/public/downloads" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Pusat Unduhan
                                </Link>
                                <Link href="/public/announcement" className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-700">
                                    Pengumuman
                                </Link>
                            </div>
                            <Link href="/login" className="btn-outline whitespace-nowrap">
                                Masuk
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="border-b border-outline-variant">
                    <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
                        <p className="micro text-brand-700">Satu NISN · Satu Data · Satu Layanan</p>
                        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-cemara sm:text-5xl lg:text-6xl">
                            Penerimaan Murid Baru
                            <br className="hidden sm:block" />
                            <span className="text-brand-800"> Jawa Barat</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
                            Portal terpadu penerimaan peserta didik baru Provinsi Jawa Barat.
                            Transparan, cepat, dan akuntabel untuk seluruh warga Jabar.
                        </p>

                        {/* Search */}
                        <form
                            onSubmit={handleSearch}
                            className="mx-auto mt-12 flex max-w-2xl flex-col gap-2 rounded-8 border border-outline bg-white p-2 sm:flex-row"
                        >
                            <label htmlFor="no-pendaftaran" className="sr-only">Nomor Pendaftaran atau NISN</label>
                            <input
                                id="no-pendaftaran"
                                type="text"
                                value={data.no_pendaftaran}
                                onChange={(e) => setData('no_pendaftaran', e.target.value)}
                                className="flex-1 rounded-8 px-4 py-3 text-base outline-none placeholder:text-ink-faint"
                                placeholder="Masukkan No. Pendaftaran atau NISN…"
                                required
                            />
                            <button type="submit" disabled={processing} className="btn-primary px-7">
                                {processing ? 'Mencari…' : 'Cek Hasil'}
                            </button>
                        </form>

                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-faint">
                            <span className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                                Sistem berjalan normal
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
                                Periode aktif: {periodYear}
                            </span>
                        </div>

                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link href="/login" className="btn-primary w-full px-8 py-3.5 sm:w-auto">
                                Mulai Pendaftaran
                            </Link>
                            <a
                                href="#cara-daftar"
                                className="btn-outline w-full px-8 py-3.5 sm:w-auto"
                            >
                                Panduan Pendaftaran
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="mx-auto mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
                            <StatCard label="Sekolah Peserta" value={formatNumber(stats?.schools ?? 0)} />
                            <StatCard label="Jalur Penerimaan" value={formatNumber(stats?.paths ?? 0)} />
                            <StatCard label="Total Kuota" value={formatNumber(stats?.kuota ?? 0)} accent hint="kursi tersedia" />
                        </div>

                        {period && (
                            <p className="mx-auto mt-10 inline-block rounded-8 border border-outline-variant bg-white px-5 py-2.5 text-xs text-ink-soft">
                                Periode pendaftaran {period.year ?? ''}:{' '}
                                <span className="font-bold text-ink">{fmtDate(period.registration_start)}</span> —{' '}
                                <span className="font-bold text-ink">{fmtDate(period.registration_end)}</span>
                            </p>
                        )}
                    </div>
                </section>

                {/* How to register */}
                <section id="cara-daftar" className="border-b border-outline-variant bg-surface-container-low/60">
                    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                        <div className="mb-14 text-center">
                            <p className="micro text-brand-700">Alur Pendaftaran</p>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-cemara sm:text-4xl">
                                Empat Langkah Sederhana
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {HOW.map((s) => (
                                <div key={s.n} className="card p-7 transition-colors hover:border-brand-400">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-8 bg-brand-50">
                                        <span className="font-extrabold tracking-tight text-brand-700">{s.n}</span>
                                    </div>
                                    <h3 className="mt-5 text-lg font-bold tracking-tight text-ink">{s.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Admission paths */}
                <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mb-14 text-center">
                        <p className="micro text-brand-700">Opsi Jalur</p>
                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-cemara sm:text-4xl">
                            Pilih Jalur yang Sesuai
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {PATHS.map((p) => (
                            <div key={p.code} className="card p-7 transition-colors hover:border-brand-400">
                                <div className="flex h-11 w-11 items-center justify-center rounded-8 bg-brand-50 text-brand-700">
                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        {p.icon}
                                    </svg>
                                </div>
                                <h3 className="mt-5 text-lg font-bold tracking-tight text-ink">{p.name}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-16 text-center">
                        <Link href="/login" className="btn-primary px-9 py-3.5">
                            Mulai Pendaftaran
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-auto border-t border-outline-variant bg-white">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-xs text-ink-faint sm:flex-row sm:px-6 lg:px-8">
                        <div className="text-center sm:text-left">
                            © {year} Dinas Pendidikan Provinsi Jawa Barat — SPMB Terintegrasi
                        </div>
                        <div className="flex gap-6 font-semibold">
                            <Link href="/public/directory" className="transition-colors hover:text-brand-700">Direktori</Link>
                            <Link href="/public/downloads" className="transition-colors hover:text-brand-700">Unduhan</Link>
                            <Link href="/public/announcement" className="transition-colors hover:text-brand-700">Pengumuman</Link>
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
        : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}