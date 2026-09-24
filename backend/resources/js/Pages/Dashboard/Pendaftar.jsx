import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';
import StatCard from '../../Components/StatCard';
import { useState } from 'react';

const STATUS_LABELS = {
    draft: 'Draf',
    perbaikan: 'Perlu Perbaikan',
    verified: 'Terverifikasi',
    rejected: 'Ditolak',
};

const TYPE_LABELS = {
    'selection.published': 'Hasil Seleksi Tersedia',
};

export default function Pendaftar({ registration, kpis, notifications, notifications_unread }) {
    const { auth, flash } = usePage().props;
    const [viewed, setViewed] = useState(false);

    const hasRegistration = registration?.no_pendaftaran;

    const markAllRead = () => {
        router.post('/notifications/read');
    };

    const renderMainContent = () => {
        if (!hasRegistration) {
            return (
                <div className="card px-8 py-16 text-center transition-colors hover:border-brand-400">
                    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-ink">Belum mulai pendaftaran</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
                        Jalur pendaftaran 2026 sedang dibuka. Pastikan dokumen Anda siap sebelum memulai.
                    </p>
                    <Link href="/pendaftaran" className="btn-primary mt-6 px-8 py-3">
                        Mulai Daftar Sekarang
                    </Link>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard
                            label="Status"
                            value={STATUS_LABELS[registration.status] ?? 'Proses'}
                            accent={registration.status === 'verified'}
                        />
                        <StatCard label="No. Pendaftaran" value={registration.no_pendaftaran} />
                        <StatCard label="Dokumen" value={`${kpis.dokumen} buah`} />
                    </div>

                    {/* Verification feedback */}
                    {['perbaikan', 'rejected'].includes(registration.status) && (
                        <div className="rounded-8 border border-error-container bg-error-container/40 p-5">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-ink">
                                        {registration.status === 'rejected' ? 'Pendaftaran ditolak' : 'Tindakan diperlukan'}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                                        {kpis.verification?.notes ?? 'Mohon periksa kembali kelengkapan dokumen Anda.'}
                                    </p>
                                </div>
                                <Link href="/pendaftaran" className="btn-ghost shrink-0">
                                    Perbaiki
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
                            <h2 className="font-bold tracking-tight text-ink">Detail Pendaftaran</h2>
                            <Badge status={registration.status} />
                        </div>
                        <dl className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2">
                            <DetailRow label="Jalur Pendaftaran" value={registration.path?.name ?? 'Belum dipilih'} />
                            <DetailRow label="Sekolah Tujuan" value={
                                registration.choices?.length
                                    ? registration.choices.map((c) => `${c.priority}. ${c.school?.name}`).join(' / ')
                                    : 'Belum dipilih'
                            } />
                            <DetailRow label="Kelengkapan Dokumen" value={
                                registration.documents?.length
                                    ? `${registration.documents.length} Dokumen Terunggah`
                                    : 'Belum ada dokumen'
                            } />
                            <DetailRow label="Periode" value={registration.period?.year ?? '2026'} />
                        </dl>
                    </div>

                    <div className="rounded-8 border border-brand-100 bg-brand-50 px-6 py-4">
                        <p className="text-sm leading-relaxed text-brand-900">
                            {registration.status === 'submitted'
                                ? 'Pendaftaran Anda telah dikirim dan sedang dalam proses verifikasi oleh operator sekolah. Mohon tunggu pemberitahuan selanjutnya.'
                                : registration.status === 'verified'
                                    ? 'Selamat! Pendaftaran Anda telah terverifikasi. Silakan pantau menu pengumuman untuk hasil seleksi.'
                                    : registration.status === 'perbaikan'
                                        ? 'Data Anda perlu diperbaiki. Silakan cek catatan di atas dan unggah ulang dokumen yang salah.'
                                        : registration.status === 'rejected'
                                            ? 'Mohon maaf, pendaftaran Anda ditolak karena tidak memenuhi syarat. Silakan cek catatan alasan penolakan.'
                                            : 'Lengkapi semua data dan unggah dokumen persyaratan agar dapat segera diverifikasi.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/pendaftaran" className="btn-outline flex-1 py-3.5 text-center">
                            {['draft', 'perbaikan'].includes(registration.status) ? 'Edit Pendaftaran' : 'Lihat Detail'}
                        </Link>
                        <Link href="/pengaduan" className="btn-outline flex-1 py-3.5 text-center">
                            Ajukan Pengaduan
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
                            <h2 className="font-bold tracking-tight text-ink">Pengumuman</h2>
                            {notifications_unread > 0 && !viewed && (
                                <button
                                    onClick={() => { markAllRead(); setViewed(true); }}
                                    className="rounded-full bg-brand-700 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-brand-800"
                                >
                                    Tandai Dibaca
                                </button>
                            )}
                        </div>
                        <ul className="max-h-[400px] divide-y divide-outline-variant overflow-y-auto">
                            {notifications?.length === 0 ? (
                                <li className="p-8 text-center text-sm text-ink-faint">Belum ada pengumuman baru.</li>
                            ) : (
                                notifications.map((n) => (
                                    <li key={n.id} className="p-4 transition-colors hover:bg-surface-container-low">
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? 'bg-outline' : 'bg-brand-500'}`}
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-bold text-ink">
                                                        {TYPE_LABELS[n.type] ?? n.type.replace(/[._]/g, ' ').toUpperCase()}
                                                    </span>
                                                    <span className="shrink-0 text-[10px] text-ink-faint">{n.created_at}</span>
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
                                                    {n.payload?.message ?? (n.type === 'selection.published' ? 'Klik untuk melihat hasil penempatan sekolah Anda.' : 'Ada informasi baru mengenai pendaftaran Anda.')}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-cemara">{auth.user.name}</h1>
                        <p className="mt-1 text-sm text-ink-soft">Pantau status pendaftaran siswa baru Anda.</p>
                    </div>
                    {hasRegistration && (
                        <Link href="/pendaftaran" className="btn-primary px-6 py-2.5">
                            Lanjutkan Pendaftaran
                        </Link>
                    )}
                </div>
                {renderMainContent()}
            </div>
        </AppLayout>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-outline-variant py-2 last:border-0">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="text-right text-sm font-bold text-ink">{value ?? '—'}</dd>
        </div>
    );
}