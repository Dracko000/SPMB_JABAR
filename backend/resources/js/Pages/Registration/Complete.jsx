import { Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';

export default function Complete({ registration }) {
    return (
        <AppLayout>
            <div className="mx-auto max-w-xl py-16 text-center">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-50">
                    <svg className="size-10 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-cemara">Pendaftaran Terkirim</h1>
                <p className="mt-3 text-base leading-relaxed text-ink-soft">
                    Pendaftaran Anda telah diterima sistem.
                    <br />
                    Mohon simpan nomor pendaftaran berikut untuk pelacakan status.
                </p>

                <div className="mt-10 rounded-8 border border-brand-700 bg-brand-50 px-8 py-7">
                    <p className="micro text-brand-700">Nomor Pendaftaran</p>
                    <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-cemara">
                        {registration.no_pendaftaran}
                    </p>
                </div>

                <div className="card mt-8 divide-y divide-outline-variant p-8 text-left">
                    <Detail label="Jalur Pendaftaran" value={registration.path?.name} />
                    <Detail label="Sekolah Tujuan" value={registration.choices?.map((c) => `${c.priority}. ${c.school?.name}`).join(' · ')} />
                    <Detail label="Status Saat Ini" value="Menunggu verifikasi sekolah" last />
                </div>

                <div className="mt-10 space-y-4">
                    <p className="text-sm text-ink-faint">
                        Pantau status pendaftaran Anda secara berkala melalui dashboard personal.
                    </p>
                    <div className="flex flex-col justify-center gap-3 sm:flex-row">
                        <Link href="/dashboard" className="btn-primary px-8 py-3">
                            Ke Dashboard Saya
                        </Link>
                        <Link href="/pengaduan" className="btn-outline px-8 py-3">
                            Butuh Bantuan?
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Detail({ label, value, last = false }) {
    return (
        <div className={`flex items-center justify-between py-4 ${last ? '' : 'border-b border-outline-variant'}`}>
            <span className="text-sm font-medium text-ink-soft">{label}</span>
            <span className="text-right text-sm font-bold text-ink">{value ?? '—'}</span>
        </div>
    );
}