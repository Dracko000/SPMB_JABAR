import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

const DECISIONS = [
    ['valid', 'Valid'],
    ['perbaikan', 'Perlu Perbaikan'],
    ['ditolak', 'Ditolak'],
];

export default function Index({ registrations }) {
    const { flash, errors } = usePage().props;
    const [open, setOpen] = useState(null);

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-cemara">Verifikasi Pendaftar</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    Registrasi yang mengajukan ke sekolah Anda{' '}
                    <span className="font-bold text-ink">({registrations.length})</span>
                </p>
            </div>

            <div className="mt-8 space-y-4">
                {registrations.length === 0 ? (
                    <div className="border-2 border-dashed border-outline-variant bg-white px-12 py-20 text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-container-low text-ink-faint">
                            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-ink-soft">Tidak ada pendaftar menunggu verifikasi.</p>
                    </div>
                ) : registrations.map((r) => (
                    <div key={r.id} className="card overflow-hidden transition-colors hover:border-brand-400">
                        <button
                            onClick={() => setOpen(open === r.id ? null : r.id)}
                            className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-container-low"
                        >
                            <div>
                                <p className="text-lg font-bold tracking-tight text-ink">{r.student?.nama}</p>
                                <p className="text-xs font-mono text-ink-soft">{r.no_pendaftaran}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-surface-container px-3 py-1 text-sm font-medium text-ink-soft">
                                    {r.path?.name}
                                </span>
                                <Badge status={r.status} />
                            </div>
                        </button>

                        {open === r.id && (
                            <div className="border-t border-outline-variant bg-surface-container-low/50 px-6 py-6">
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    <div>
                                        <h3 className="micro mb-4">Dokumen Persyaratan</h3>
                                        <div className="divide-y divide-outline-variant">
                                            {r.documents?.length === 0 && (
                                                <p className="text-sm italic text-ink-faint">Belum ada dokumen terunggah.</p>
                                            )}
                                            {r.documents.map((d) => (
                                                <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-7 items-center justify-center rounded-8 bg-surface-container text-ink-soft">
                                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <span className="font-bold text-ink">{d.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {d.catatan && <span className="text-xs italic text-ink-faint">{d.catatan}</span>}
                                                        <Badge status={d.status} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="micro mb-4">Pengambilan Keputusan</h3>
                                        <ReviewForm registration={r} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}

function ReviewForm({ registration }) {
    const { errors } = usePage().props;
    const [status, setStatus] = useState('');
    const [catatan, setCatatan] = useState('');
    const [checklist, setChecklist] = useState({
        is_kk_verified: false,
        is_ijazah_verified: false,
        is_alamat_verified: false,
    });

    const toggleCheck = (key) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const review = () => {
        router.post(`/verifikasi/${registration.id}/review`, {
            status,
            catatan: catatan || undefined,
            ...checklist,
        }, { preserveScroll: true });
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 space-y-3">
                <h4 className="micro">Checklist Verifikasi</h4>
                <div className="grid grid-cols-1 gap-2.5">
                    {[
                        { id: 'is_kk_verified', label: 'KK Sesuai & Valid' },
                        { id: 'is_ijazah_verified', label: 'Ijazah/SKL Valid' },
                        { id: 'is_alamat_verified', label: 'Alamat Domisili Valid' },
                    ].map((item) => (
                        <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-8 border border-outline-variant bg-white px-3.5 py-3 transition-colors hover:bg-surface-container">
                            <input
                                type="checkbox"
                                checked={checklist[item.id]}
                                onChange={() => toggleCheck(item.id)}
                                className="size-4 rounded border-outline text-brand-700 focus:ring-brand-500"
                            />
                            <span className="text-sm font-medium text-ink">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
                {DECISIONS.map(([v, label]) => (
                    <button
                        key={v}
                        onClick={() => setStatus(v)}
                        className={`flex-1 cursor-pointer rounded-8 border px-4 py-2.5 text-xs font-bold transition-colors ${
                            status === v
                                ? v === 'ditolak'
                                    ? 'border-error bg-error text-white'
                                    : v === 'perbaikan'
                                        ? 'border-warn-600 bg-warn-600 text-white'
                                        : 'border-brand-700 bg-brand-700 text-white'
                                : 'border-outline-variant bg-white text-ink-soft hover:border-brand-400 hover:text-ink'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <label htmlFor="review-notes" className="label">Catatan Verifikator</label>
                <input
                    id="review-notes"
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tambahkan alasan jika ditolak atau perlu perbaikan…"
                    className="input"
                />
            </div>

            <button onClick={review} disabled={!status} className="btn-primary mt-4 w-full py-2.5">
                Simpan & Terapkan Keputusan
            </button>
            {errors.review && <p className="mt-3 text-center text-xs font-medium text-error">{errors.review}</p>}
        </div>
    );
}