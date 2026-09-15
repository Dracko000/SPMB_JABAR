import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

export default function Index({ complaints, categories }) {
    const { auth, flash } = usePage().props;
    const isAdmin = ['admin_provinsi', 'admin_kabkota'].includes(auth.user.role);

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-cemara">Pengaduan</h1>
                    <p className="text-sm text-ink-faint">
                        {isAdmin ? 'Semua pengaduan warga' : 'Ajukan kendala dan lacak status Anda'}
                    </p>
                </div>
                {!isAdmin && <ComplaintForm categories={categories} />}
            </div>

            <div className="mt-6 space-y-3">
                {complaints.length === 0 ? (
                    <div className="rounded-8 border border-dashed border-outline px-6 py-10 text-center text-ink-faint">
                        Belum ada pengaduan.
                    </div>
                ) : complaints.map((c) => (
                    <div key={c.id} className="rounded-8 border border-outline-variant bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-brand-700">{c.ticket_no}</span>
                                <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-ink-soft">{c.category}</span>
                            </div>
                            <Badge status={c.status} />
                        </div>
                        <p className="mt-3 font-bold text-ink">{c.subject}</p>
                        <p className="mt-1 text-sm text-ink-soft">{c.message}</p>
                        {c.admin_response && (
                            <p className="mt-3 rounded-8 bg-surface-container-low px-3 py-2 text-sm text-ink-soft">
                                <span className="font-semibold text-brand-700">Tanggapan: </span>{c.admin_response}
                            </p>
                        )}
                        {isAdmin && <RespondForm complaint={c} />}
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}

function ComplaintForm({ categories }) {
    const { errors } = usePage().props;
    const [form, setForm] = useState({ category: categories[0], subject: '', message: '' });

    const submit = (e) => {
        e.preventDefault();
        router.post('/pengaduan', form, { preserveScroll: true, onSuccess: () => setForm({ ...form, subject: '', message: '' }) });
    };

    return (
        <form onSubmit={submit} className="mt-4 sm:mt-0 w-full sm:w-auto rounded-8 border border-outline-variant bg-white p-4 sm:max-w-sm">
            <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-8 border border-outline-variant px-3 py-2 text-sm focus:border-brand-700"
            >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Perihal"
                required
                className="mt-2 w-full rounded-8 border border-outline-variant px-3 py-2 text-sm"
            />
            <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Uraikan kendala Anda"
                required
                rows={3}
                className="mt-2 w-full rounded-8 border border-outline-variant px-3 py-2 text-sm"
            />
            <button className="mt-3 rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
                Kirim Pengaduan
            </button>
            {errors.category && <p className="mt-1 text-xs text-error">{errors.category}</p>}
        </form>
    );
}

function RespondForm({ complaint }) {
    const [status, setStatus] = useState(complaint.status);
    const [response, setResponse] = useState('');

    const respond = () => {
        router.post(`/admin/pengaduan/${complaint.id}/respond`, { status, response: response || undefined }, { preserveScroll: true });
    };

    return (
        <div className="mt-4 border-t border-outline-variant pt-3">
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-8 border border-outline-variant px-3 py-1.5 text-xs"
                >
                    <option value="dibuat">Dibuat</option>
                    <option value="diproses">Diproses</option>
                    <option value="selesai">Selesai</option>
                </select>
                <input
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Tanggapan"
                    className="flex-1 min-w-32 rounded-8 border border-outline-variant px-3 py-1.5 text-xs"
                />
                <button onClick={respond} className="rounded-8 bg-brand-700 px-3 py-1.5 text-xs font-bold text-white">
                    Simpan
                </button>
            </div>
        </div>
    );
}