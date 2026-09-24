import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/Badge';

export default function SchoolDashboard({ school, paths, requests }) {
    const { data, setData, post, processing, reset } = useForm({
        admission_path_id: '',
        requested_kuota: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/sekolah/quota-request', {
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Dashboard Sekolah — SPMB JABAR" />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-cemara">Dashboard Sekolah</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        Kelola pengajuan kuota dan pantau status pendaftaran sekolah Anda.
                    </p>
                </div>
                <div className="card inline-flex w-fit items-center gap-2 px-4 py-2">
                    <span className="micro">Sekolah</span>
                    <span className="text-sm font-bold text-ink">{school.name}</span>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Request form */}
                <div className="lg:col-span-1">
                    <div className="card p-6">
                        <h2 className="text-lg font-bold tracking-tight text-ink">Pengajuan Kuota Baru</h2>
                        <form onSubmit={submit} className="mt-5 space-y-5">
                            <div>
                                <label htmlFor="quota-path" className="label">Jalur Penerimaan</label>
                                <select
                                    id="quota-path"
                                    value={data.admission_path_id}
                                    onChange={(e) => setData('admission_path_id', e.target.value)}
                                    className="input"
                                    required
                                >
                                    <option value="">Pilih Jalur</option>
                                    {paths.map(path => (
                                        <option key={path.id} value={path.id}>{path.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quota-amount" className="label">Jumlah Kuota</label>
                                <input
                                    id="quota-amount"
                                    type="number"
                                    value={data.requested_kuota}
                                    onChange={(e) => setData('requested_kuota', e.target.value)}
                                    className="input"
                                    placeholder="Contoh: 120"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={processing} className="btn-primary w-full py-2.5">
                                {processing ? 'Mengirim…' : 'Ajukan Kuota'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Request history */}
                <div className="card overflow-hidden lg:col-span-2">
                    <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
                        <h2 className="text-lg font-bold tracking-tight text-ink">Riwayat Pengajuan Kuota</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-container-low text-xs font-bold uppercase text-ink-soft">
                                <tr>
                                    <th className="border-b border-outline-variant px-6 py-3.5">Jalur</th>
                                    <th className="border-b border-outline-variant px-6 py-3.5 text-center">Jumlah</th>
                                    <th className="border-b border-outline-variant px-6 py-3.5 text-center">Status</th>
                                    <th className="border-b border-outline-variant px-6 py-3.5">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {requests.length > 0 ? (
                                    requests.map(req => (
                                        <tr key={req.id} className="transition-colors hover:bg-surface-container-low">
                                            <td className="px-6 py-4 font-medium text-ink">{req.path.name}</td>
                                            <td className="px-6 py-4 text-center text-ink">{req.requested_kuota}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge status={req.status === 'approved' ? 'verified' : req.status === 'rejected' ? 'rejected' : 'pending'} />
                                            </td>
                                            <td className="px-6 py-4 text-xs text-ink-soft">
                                                {new Date(req.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-sm italic text-ink-faint">
                                            Belum ada riwayat pengajuan kuota.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}