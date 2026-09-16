import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';
import StatCard from '../../Components/StatCard';
import { useState } from 'react';

export default function Pendaftar({ registration, kpis, notifications, notifications_unread }) {
    const { auth, flash } = usePage().props;
    const [viewed, setViewed] = useState(false);

    const hasRegistration = registration?.no_pendaftaran;

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-cemara">Halo, {auth.user.name} 👋</h1>
                    <p className="text-sm text-ink-faint">Status pendaftaran Anda</p>
                </div>
                {hasRegistration && (
                    <Link href="/pendaftaran" className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
                        Lanjutkan Pendaftaran
                    </Link>
                )}
            </div>

            {!hasRegistration ? (
                <div className="mt-8 rounded-8 border border-dashed border-outline px-6 py-12 text-center">
                    <p className="text-lg font-bold text-ink">Belum mulai pendaftaran</p>
                    <p className="mt-1 text-sm text-ink-faint">Jalur pendaftaran 2026 sedang dibuka. Ayo daftar sekarang.</p>
                    <Link href="/pendaftaran" className="mt-5 inline-block rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">
                        Mulai Daftar
                    </Link>
                </div>
            ) : (
                <div className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard label="Status" value={registration.status === 'draft' ? 'Draf' : 'Terverifikasi'}
                                  accent={registration.status === 'verified'} />
                        <StatCard label="No. Pendaftaran" value={registration.no_pendaftaran} />
                        <StatCard label="Dokumen" value={`${kpis.dokumen} buah`} />
                    </div>

                    <div className="mt-6 rounded-8 border border-outline-variant bg-white overflow-hidden">
                        <div className="border-b border-outline-variant px-5 py-4">
                            <h2 className="font-bold text-ink">Detail Pendaftaran</h2>
                        </div>
                        <dl className="divide-y divide-outline-variant px-5 text-sm">
                            <DetailRow label="Jalur" value={registration.path?.name ?? 'Belum dipilih'} />
                            <DetailRow label="Sekolah Pilihan (prioritas)" value={
                                registration.choices?.length
                                    ? registration.choices.map((c) => `${c.priority}. ${c.school?.name}`).join(' ')
                                    : 'Belum dipilih'
                            } />
                            <DetailRow label="Dokumen" value={
                                registration.documents?.length
                                    ? registration.documents.map((d) => d.type).join(', ')
                                    : 'Belum diunggah'
                            } />
                        </dl>
                    </div>

                    <div className="mt-6 rounded-8 border border-brand-700 bg-brand-50 px-5 py-4">
                        <p className="text-sm text-brand-800">
                            {registration.status === 'submitted'
                                ? 'Pendaftaran Anda telah dikirim dan sedang menunggu verifikasi sekolah. Pantau terus statusnya.'
                                : registration.status === 'verified'
                                    ? 'Selamat! Pendaftaran Anda telah terverifikasi. Tunggu pengumuman hasil seleksi.'
                                    : 'Lengkapi langkah-langkah pendaftaran Anda.'}
                        </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/pendaftaran" className="rounded-8 border border-outline-variant bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand-700">
                            {registration.status === 'draft' ? 'Edit Pendaftaran' : 'Lihat Pendaftaran'}
                        </Link>
                        <Link href="/pengaduan" className="rounded-8 border border-outline-variant bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand-700">
                            Ajukan Pengaduan
                        </Link>
                    </div>
                </div>
            )}

            <div className="mt-6 rounded-8 border border-outline-variant bg-white overflow-hidden">
                <div className="border-b border-outline-variant px-5 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-ink">Pengumuman</h2>
                    {notifications_unread > 0 && !viewed ? (
                            <button onClick={markAllRead} className="rounded-8 border border-outline-variant px-3 py-1.5 text-xs font-bold text-ink hover:border-brand-700">
                                Tandai sudah dibaca
                            </button>
                        ) : (
                            notifications_unread > 0 && <Badge status="pending">{notifications_unread} baru</Badge>
                        )}
                </div>
                {notifications?.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-ink-faint">Belum ada pengumuman.</p>
                ) : (
                    <ul className="divide-y divide-outline-variant text-sm">
                        {notifications.map((n) => (
                            <li key={n.id} className="px-5 py-3">
                                <span className="font-semibold text-ink">
                                    {n.type === 'selection.published' ? 'Hasil seleksi tersedia' : n.type.replace(/[._]/g, ' ')}
                                </span>
                                {n.payload?.no_pendaftaran && <span className="ml-2 font-mono text-xs text-ink-faint">{n.payload.no_pendaftaran}</span>}
                                <p className="mt-0.5 text-xs text-ink-faint">{n.created_at}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <LogoutButton />
        </AppLayout>
    );
}

function markAllRead() {
    router.get('/notifications/read');
}

function DetailRow({ label, value }) {
    return (
        <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="font-semibold text-ink sm:text-right">{value ?? '—'}</dd>
        </div>
    );
}

function LogoutButton() {
    return (
        <div className="mt-8">
            <button
                onClick={() => router.post('/logout')}
                className="text-xs font-semibold text-ink-faint hover:text-error"
            >
                Keluar
            </button>
        </div>
    );
}