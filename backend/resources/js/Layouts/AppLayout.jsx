import { Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

export default function AppLayout({ header, children }) {
    return (
        <>
            <Head titleTemplate="%s — SPMB JABAR" />
            <div className="min-h-screen bg-surface text-ink">
                <header className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="size-9 rounded-8 bg-brand-700 text-white flex items-center justify-center font-extrabold">
                                S
                            </span>
                            <span className="font-extrabold text-cemara leading-none">
                                SPMB JABAR
                            </span>
                        </Link>
                        {header ?? <StatusBadge />}
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>

                <footer className="border-t border-outline-variant mt-12">
                    <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-ink-faint sm:px-6 lg:px-8">
                        © {new Date().getFullYear()} Dinas Pendidikan Provinsi Jawa Barat — SPMB Terintegrasi
                    </div>
                </footer>
            </div>
        </>
    );
}

function StatusBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
            <span className="size-2 rounded-full bg-brand-500 animate-pulse" />
            Portal Pendaftaran Terbuka
        </span>
    );
}