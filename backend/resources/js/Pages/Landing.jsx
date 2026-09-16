import { Head, Link } from '@inertiajs/react';

export default function Landing({ name }) {
    return (
        <>
            <Head title="Beranda" />
            <div className="min-h-screen bg-surface text-ink flex items-center justify-center px-6">
                <div className="max-w-xl w-full text-center">
                    <div className="mx-auto mb-6 size-16 rounded-full bg-brand-700 flex items-center justify-center text-white font-extrabold text-2xl">
                        S
                    </div>
                    <h1 className="text-3xl font-extrabold text-cemara">SPMB JABAR</h1>
                    <p className="mt-3 font-semibold">
                        Sistem Penerimaan Murid Baru Terintegrasi Jawa Barat
                    </p>
                    <p className="mt-1 text-sm text-ink-faint">Terhubung sebagai <span className="font-semibold text-ink">{name}</span></p>
                    <div className="mt-6 rounded-8 border-2 border-brand-700 bg-brand-50 px-4 py-3 text-sm">
                        Inertia + React + Vite aktif — tema Jabar Civic Portal aktif.
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                        <Link href="/login" className="rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">
                            Masuk Staf
                        </Link>
                        <Link href="/auth/nisn" className="rounded-8 border border-outline-variant px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-700">
                            Masuk Murid (NISN)
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}