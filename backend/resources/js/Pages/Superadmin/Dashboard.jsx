import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const ROLE_LABELS = {
    superadmin: 'Super Admin',
    admin_provinsi: 'Admin Provinsi',
    admin_kabkota: 'Admin Kab/Kota',
};

export default function SuperadminDashboard({ admins, regions, stats }) {
    const [showCreate, setShowCreate] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        password: '',
        region_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post('/superadmin/users', {
            onSuccess: () => {
                form.reset();
                setShowCreate(false);
            },
        });
    };

    const reset2fa = (admin) => {
        if (window.confirm(`Reset 2FA ${admin.name}? Ia akan bisa login tanpa kode Authenticator.`)) {
            router.post(`/superadmin/users/${admin.id}/reset-2fa`, {}, { preserveScroll: true });
        }
    };

    const toggleRight = (admin) => {
        const action = admin.can_verify_all ? 'cabut' : 'beri';
        if (window.confirm(`${action === 'beri' ? 'Beri' : 'Cabut'} hak verifikasi global (acc semua pendaftar) untuk ${admin.name}?`)) {
            router.post(`/superadmin/users/${admin.id}/verification-right`, {}, { preserveScroll: true });
        }
    };

    const regionName = (id) => regions.find((r) => r.id === id)?.name ?? '—';

    return (
        <AppLayout>
            <Head title="Panel Super Admin — SPMB JABAR" />
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="micro text-brand-700">Otoritas Tertinggi</p>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-cemara sm:text-3xl">
                            Panel Super Admin
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                            Kelola akun Admin Provinsi, reset autentikasi dua faktor (2FA), dan
                            beri hak verifikasi global — acc/menilai seluruh pendaftar di semua sekolah.
                        </p>
                    </div>
                    <button onClick={() => setShowCreate((v) => !v)} className="btn-primary shrink-0">
                        {showCreate ? 'Tutup' : '+ Buat Admin Provinsi'}
                    </button>
                </div>

                {/* KPI */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Akun Admin', value: stats.admin_total, hint: 'provinsi + kab/kota' },
                        { label: '2FA Aktif', value: stats.twofa_active, hint: 'dari semua akun admin' },
                        { label: 'Verifikator Global', value: stats.global_verifiers, hint: 'acc semua pendaftar' },
                    ].map((k, i) => (
                        <div key={k.label} className={i === 0 ? 'kpi-accent' : 'kpi'}>
                            <p className={i === 0 ? 'text-xs font-bold uppercase tracking-wider text-brand-100' : 'kpi-label'}>{k.label}</p>
                            <p className={`kpi-value ${i === 0 ? 'text-white' : 'text-ink'}`}>{k.value}</p>
                            <p className={i === 0 ? 'mt-1 text-xs text-brand-100' : 'mt-1 text-xs text-ink-faint'}>{k.hint}</p>
                        </div>
                    ))}
                </div>

                {/* Form buat admin */}
                {showCreate && (
                    <form onSubmit={submit} className="card mt-8 p-6 sm:p-8">
                        <h2 className="text-lg font-extrabold tracking-tight text-ink">Akun Admin Provinsi Baru</h2>
                        <p className="mt-1 text-sm text-ink-soft">
                            Akun dibuat dengan peran <span className="code-token">admin_provinsi</span> — dapat mengelola periode,
                            seleksi (dry-run/publish), dan laporan di Panel Admin.
                        </p>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="sa-name" className="label">Nama Lengkap</label>
                                <input id="sa-name" type="text" className="input" value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)} placeholder="cth: Admin Jawa Barat" required />
                                {form.errors.name && <p className="mt-1 text-xs font-medium text-error">{form.errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="sa-email" className="label">Email</label>
                                <input id="sa-email" type="email" className="input" value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)} placeholder="nama@spmb.jabar" required />
                                {form.errors.email && <p className="mt-1 text-xs font-medium text-error">{form.errors.email}</p>}
                            </div>
                            <div>
                                <label htmlFor="sa-password" className="label">Kata Sandi Awal</label>
                                <input id="sa-password" type="password" minLength={8} className="input" value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)} placeholder="min. 8 karakter" required />
                                {form.errors.password && <p className="mt-1 text-xs font-medium text-error">{form.errors.password}</p>}
                            </div>
                            <div>
                                <label htmlFor="sa-region" className="label">Wilayah (opsional)</label>
                                <select id="sa-region" className="input" value={form.data.region_id}
                                    onChange={(e) => form.setData('region_id', e.target.value)}>
                                    <option value="">— Provinsi (semua wilayah) —</option>
                                    {regions.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {form.errors.region_id && <p className="mt-1 text-xs font-medium text-error">{form.errors.region_id}</p>}
                            </div>
                        </div>
                        <div className="mt-7 flex items-center justify-end gap-3">
                            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">Batal</button>
                            <button type="submit" disabled={form.processing} className="btn-primary px-7">
                                {form.processing ? 'Menyimpan…' : 'Buat Akun'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Daftar admin */}
                <div className="card mt-8 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
                        <h2 className="text-base font-extrabold tracking-tight text-ink">Daftar Akun Admin</h2>
                        <span className="text-xs font-semibold text-ink-faint">{admins.length} akun</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-container-low text-xs font-bold uppercase text-ink-soft">
                                <tr>
                                    <th className="px-6 py-3.5">Nama</th>
                                    <th className="px-6 py-3.5">Email</th>
                                    <th className="px-6 py-3.5">Peran</th>
                                    <th className="px-6 py-3.5">Wilayah</th>
                                    <th className="px-6 py-3.5 text-center">2FA</th>
                                    <th className="px-6 py-3.5 text-center">Verifikasi Global</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="transition-colors hover:bg-surface-container-low">
                                        <td className="px-6 py-4 font-bold text-ink">
                                            {admin.name}
                                            {admin.is_superadmin && (
                                                <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-800 ring-1 ring-inset ring-brand-200">
                                                    Anda
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-ink-soft">{admin.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-inset ring-outline">
                                                {ROLE_LABELS[admin.role] ?? admin.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-ink-soft">{regionName(admin.region_id)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                admin.twofa_enrolled
                                                    ? 'bg-brand-50 text-brand-700 ring-brand-200'
                                                    : 'bg-surface-container text-ink-faint ring-outline'
                                            }`}>
                                                {admin.twofa_enrolled ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {admin.is_superadmin ? (
                                                <span className="text-xs text-ink-faint">Inheren</span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                    admin.can_verify_all
                                                        ? 'bg-brand-50 text-brand-700 ring-brand-200'
                                                        : 'bg-surface-container text-ink-faint ring-outline'
                                                }`}>
                                                    {admin.can_verify_all ? 'Diberi' : '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {!admin.is_superadmin && (
                                                    <button
                                                        onClick={() => toggleRight(admin)}
                                                        className="rounded-8 border border-outline bg-white px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:border-brand-700 hover:text-brand-800"
                                                    >
                                                        {admin.can_verify_all ? 'Cabut Verif. Global' : 'Beri Verif. Global'}
                                                    </button>
                                                )}
                                                {admin.twofa_enrolled && !admin.is_superadmin && (
                                                    <button
                                                        onClick={() => reset2fa(admin)}
                                                        className="rounded-8 border border-outline bg-white px-2.5 py-1.5 text-xs font-bold text-error transition-colors hover:border-error hover:bg-error-container"
                                                    >
                                                        Reset 2FA
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-6 text-xs leading-relaxed text-ink-faint">
                    Setiap aksi (buat admin, reset 2FA, beri/cabut hak verifikasi global) tercatat di log audit.
                    Hak verifikasi global membuat akun dapat membuka halaman Verifikasi dan menilai seluruh
                    pendaftar di semua sekolah — tanpa dibatasi scope sekolahnya.
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                    Butuh kelola periode, seleksi, atau pengaduan?{' '}
                    <Link href="/admin" className="font-semibold text-brand-700 hover:text-brand-800">Buka Panel Admin</Link>.
                </p>
            </div>
        </AppLayout>
    );
}