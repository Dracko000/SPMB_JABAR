import { Link, useForm, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

const NAV = {
    pendaftar: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/pendaftaran', label: 'Pendaftaran' },
        { href: '/pengaduan', label: 'Pengaduan' },
    ],
    operator_sekolah: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/verifikasi', label: 'Verifikasi' },
        { href: '/sekolah', label: 'Kelola Sekolah' },
    ],
    verifikator: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/verifikasi', label: 'Verifikasi' },
    ],
    operator_smp: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/smp', label: 'Data Siswa' },
    ],
    admin_kabkota: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/admin', label: 'Panel Admin' },
    ],
    admin_provinsi: [
        { href: '/dashboard', label: 'Beranda' },
        { href: '/admin', label: 'Panel Admin' },
    ],
};

const ROLE_LABELS = {
    pendaftar: 'Peserta',
    operator_sekolah: 'Operator Sekolah',
    verifikator: 'Verifikator',
    operator_smp: 'Operator SMP',
    admin_kabkota: 'Admin Kab/Kota',
    admin_provinsi: 'Admin Provinsi',
    admin: 'Admin',
};

export default function AppLayout({ header, children }) {
    const { auth, url } = usePage().props;
    const { post, processing } = useForm();

    const handleLogout = (e) => {
        e.preventDefault();
        post('/logout');
    };

    const user = auth?.user;
    const nav = user ? NAV[user.role] ?? [] : [];

    return (
        <>
            <Head titleTemplate="%s — SPMB JABAR" />
            <div className="min-h-screen bg-surface text-ink selection:bg-brand-100 selection:text-brand-900">
                <header className="sticky top-0 z-50 border-b border-outline-variant bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3">
                            <img
                                src="/images/disdik-jabar.png"
                                alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                                className="size-10 object-contain"
                            />
                            <div className="flex flex-col leading-none">
                                <span className="text-xl font-extrabold tracking-tight text-cemara">SPMB JABAR</span>
                                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                                    Provinsi Jawa Barat
                                </span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-4">
                            {!user && (
                                <div className="hidden items-center gap-1 md:flex">
                                    <Link href="/docs" className="rounded-8 px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-container hover:text-ink">
                                        Dokumentasi
                                    </Link>
                                </div>
                            )}

                            {nav.length > 0 && (
                                <nav className="hidden items-center gap-1 md:flex">
                                    {nav.map((item) => {
                                        const active = url === item.href || url.startsWith(item.href + '/');
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`rounded-8 px-3 py-1.5 text-sm font-semibold transition-colors ${
                                                    active
                                                        ? 'bg-brand-50 text-brand-800'
                                                        : 'text-ink-soft hover:bg-surface-container hover:text-ink'
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            )}

                            {user && (
                                <div className="hidden items-center gap-2 rounded-8 border border-outline-variant bg-white py-1.5 pl-2 pr-1 sm:flex">
                                    <div className="flex flex-col leading-tight">
                                        <span className="max-w-[140px] truncate text-xs font-bold text-ink">{user.name}</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                                            {ROLE_LABELS[user.role] ?? user.role}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        disabled={processing}
                                        className="cursor-pointer rounded-8 px-2.5 py-1.5 text-xs font-bold text-ink-faint transition-colors hover:bg-surface-container hover:text-error"
                                        title="Keluar"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            )}
                            {user && (
                                <button
                                    onClick={handleLogout}
                                    disabled={processing}
                                    className="cursor-pointer rounded-8 px-2.5 py-1.5 text-xs font-bold text-ink-faint transition-colors hover:text-error sm:hidden"
                                >
                                    Keluar
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>

                <footer className="mt-20 border-t border-outline-variant bg-white">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-ink-faint sm:flex-row sm:px-6 lg:px-8">
                        <div className="text-center sm:text-left">
                            © {new Date().getFullYear()} Dinas Pendidikan Provinsi Jawa Barat — SPMB Terintegrasi
                        </div>
                        <div className="flex gap-5">
                            <Link href="/public/directory" className="font-medium transition-colors hover:text-brand-700">
                                Direktori Sekolah
                            </Link>
                            <Link href="/public/downloads" className="font-medium transition-colors hover:text-brand-700">
                                Pusat Unduhan
                            </Link>
                            <Link href="/public/announcement" className="font-medium transition-colors hover:text-brand-700">
                                Pengumuman
                            </Link>
                            <Link href="/docs" className="font-medium transition-colors hover:text-brand-700">
                                Dokumentasi
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}