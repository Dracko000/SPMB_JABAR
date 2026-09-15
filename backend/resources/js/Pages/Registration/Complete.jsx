import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Complete({ registration }) {
    return (
        <AppLayout>
            <div className="mx-auto max-w-xl text-center py-8">
                <div className="mx-auto size-16 rounded-full bg-brand-100 flex items-center justify-center">
                    <svg className="size-8 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="mt-5 text-2xl font-extrabold text-cemara">Pendaftaran Terkirim!</h1>
                <p className="mt-2 text-sm text-ink-faint">
                    Pendaftaran Anda telah diterima sistem. Simpan nomor pendaftaran berikut.
                </p>

                <div className="mt-6 rounded-8 border border-brand-700 bg-brand-50 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Nomor Pendaftaran</p>
                    <p className="mt-1 font-mono text-xl font-extrabold text-cemara">{registration.no_pendaftaran}</p>
                </div>

                <div className="mt-6 rounded-8 border border-outline-variant bg-white px-6 py-5 text-left text-sm">
                    <Detail label="Jalur" value={registration.path?.name} />
                    <Detail label="Sekolah (prioritas)" value={registration.choices?.map((c) => `${c.priority}. ${c.school?.name}`).join(' · ')} />
                    <Detail label="Status" value="Menunggu verifikasi sekolah" last />
                </div>

                <p className="mt-6 text-xs text-ink-faint">
                    Pantau status pendaftaran Anda secara berkala melalui dashboard.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                    <Link href="/dashboard" className="rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">
                        Dashboard Saya
                    </Link>
                    <Link href="/pengaduan" className="rounded-8 border border-outline-variant bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-700">
                        Butuh Bantuan?
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}

function Detail({ label, value, last = false }) {
    return (
        <div className={`flex justify-between gap-4 ${last ? '' : 'border-b border-outline-variant pb-3 mb-3'}`}>
            <span className="text-ink-soft">{label}</span>
            <span className="font-semibold text-right text-ink">{value ?? '—'}</span>
        </div>
    );
}