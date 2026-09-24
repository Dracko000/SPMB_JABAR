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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-cemara">Pusat Pengaduan</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        {isAdmin ? 'Kelola semua pengaduan warga Jawa Barat' : 'Sampaikan kendala pendaftaran Anda kepada kami'}
                    </p>
                </div>
                {!isAdmin && <ComplaintForm categories={categories} />}
            </div>

            <div className="mt-8 space-y-4">
                {complaints.length === 0 ? (
                    <div className="border-2 border-dashed border-outline-variant bg-white px-12 py-20 text-center">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-container-low text-ink-faint">
                            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-ink-soft">Belum ada riwayat pengaduan.</p>
                    </div>
                ) : complaints.map((c) => (
                    <div key={c.id} className="card p-6 transition-colors hover:border-brand-400">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-8 border border-brand-100 bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-700">
                                    {c.ticket_no}
                                </span>
                                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                                    {c.category}
                                </span>
                            </div>
                            <Badge status={c.status} />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight text-ink">{c.subject}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.message}</p>
                        {c.admin_response && (
                            <div className="mt-5 border-l-2 border-brand-300 pl-4">
                                <p className="text-sm leading-relaxed text-ink-soft">
                                    <span className="font-bold text-ink">Tanggapan admin: </span>
                                    {c.admin_response}
                                </p>
                            </div>
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
        <form onSubmit={submit} className="card w-full p-6 sm:max-w-md">
            <div className="space-y-4">
                <div>
                    <label htmlFor="complaint-category" className="label">Kategori Kendala</label>
                    <select
                        id="complaint-category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="input"
                    >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="complaint-subject" className="label">Perihal</label>
                    <input
                        id="complaint-subject"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Contoh: Kendala Upload Dokumen"
                        required
                        className="input"
                    />
                </div>
                <div>
                    <label htmlFor="complaint-message" className="label">Deskripsi Kendala</label>
                    <textarea
                        id="complaint-message"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Jelaskan detail permasalahan Anda..."
                        required
                        rows={3}
                        className="input resize-none"
                    />
                </div>
                <button className="btn-primary w-full py-3">Kirim Pengaduan</button>
                {errors.category && <p className="text-xs font-medium text-error">{errors.category}</p>}
            </div>
        </form>
    );
}

function RespondForm({ complaint }) {
    const { errors } = usePage().props;
    const [status, setStatus] = useState(complaint.status);
    const [response, setResponse] = useState('');

    const respond = () => {
        router.post(`/admin/pengaduan/${complaint.id}/respond`, { status, response: response || undefined }, { preserveScroll: true });
    };

    return (
        <div className="mt-6 border-t border-outline-variant pt-5">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor={`status-${complaint.id}`} className="label text-[10px]">Update Status</label>
                    <select
                        id={`status-${complaint.id}`}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-8 border border-outline bg-white px-3 py-2 text-xs font-medium outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                    >
                        <option value="dibuat">Dibuat</option>
                        <option value="diproses">Diproses</option>
                        <option value="selesai">Selesai</option>
                    </select>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                    <label htmlFor={`respond-${complaint.id}`} className="label text-[10px]">Tanggapan Admin</label>
                    <input
                        id={`respond-${complaint.id}`}
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Tulis jawaban solusi..."
                        className="rounded-8 border border-outline bg-white px-3 py-2 text-xs outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
                    />
                </div>
                <button onClick={respond} className="btn-primary px-4 py-2 text-xs">
                    Simpan
                </button>
            </div>
            {errors.response && <p className="mt-2 text-xs font-medium text-error">{errors.response}</p>}
        </div>
    );
}