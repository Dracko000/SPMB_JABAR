import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

export default function Index({ registrations }) {
    const { flash, errors } = usePage().props;
    const [open, setOpen] = useState(null);

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold text-cemara">Verifikasi Pendaftar</h1>
                <p className="text-sm text-ink-faint">Registrasi yang mengajukan ke sekolah Anda ({registrations.length})</p>
            </div>

            <div className="mt-6 space-y-4">
                {registrations.length === 0 ? (
                    <div className="rounded-8 border border-dashed border-outline px-6 py-10 text-center text-ink-faint">
                        Tidak ada pendaftar menunggu verifikasi.
                    </div>
                ) : registrations.map((r) => (
                    <div key={r.id} className="rounded-8 border border-outline-variant bg-white overflow-hidden">
                        <button
                            onClick={() => setOpen(open === r.id ? null : r.id)}
                            className="w-full flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-left hover:bg-surface-container-low"
                        >
                            <div>
                                <p className="font-bold text-ink">{r.student?.nama}</p>
                                <p className="text-xs font-mono text-ink-faint">{r.no_pendaftaran}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-ink-soft">{r.path?.name}</span>
                                <Badge status={r.status} />
                            </div>
                        </button>

                        {open === r.id && (
                            <div className="border-t border-outline-variant px-5 py-4">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Dokumen</h3>
                                <div className="mt-2 space-y-2">
                                    {r.documents?.length === 0 && <p className="text-sm text-ink-faint">Belum ada dokumen.</p>}
                                    {r.documents.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between rounded-8 bg-surface-container-low px-3 py-2 text-sm">
                                            <span className="font-medium text-ink">{d.type}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge status={d.status} />
                                                {d.catatan && <span className="text-xs text-ink-faint">{d.catatan}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Keputusan</h3>
                                    <ReviewForm registration={r} />
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

    const review = () => {
        router.post(`/verifikasi/${registration.id}/review`, { status, catatan: catatan || undefined }, { preserveScroll: true });
    };

    return (
        <div className="mt-2 space-y-3">
            <div className="flex flex-wrap gap-2">
                {[['valid', 'Valid', 'bg-brand-700', 'hover:bg-brand-800'], ['perbaikan', 'Perlu Perbaikan', 'bg-amber-500', 'hover:bg-amber-600'], ['ditolak', 'Ditolak', 'bg-error', 'hover:bg-red-700']].map(([v, label, bg, hover]) => (
                    <button
                        key={v}
                        onClick={() => setStatus(v)}
                        className={`rounded-8 px-4 py-1.5 text-xs font-bold text-white transition ${status === v ? bg : 'bg-outline hover:' + hover}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan (opsional)"
                className="w-full rounded-8 border border-outline-variant px-3 py-2 text-sm focus:border-brand-700 focus:outline-none"
            />
            <button
                onClick={review}
                disabled={!status}
                className="rounded-8 bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-40"
            >
                Simpan Keputusan
            </button>
            {errors.review && <p className="text-sm text-error">{errors.review}</p>}
        </div>
    );
}