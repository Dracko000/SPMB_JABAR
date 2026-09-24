import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Directory({ regions, schools, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [regionId, setRegionId] = useState(filters.region_id || '');

    const handleFilter = () => {
        router.get('/public/directory', {
            search,
            region_id: regionId,
        }, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Direktori Sekolah — SPMB JABAR" />
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-cemara">Direktori Sekolah</h1>
                    <p className="mt-3 text-base text-ink-soft">
                        Informasi sekolah dan daya tampung peserta didik baru se-Jawa Barat
                    </p>
                </div>

                {/* Filters */}
                <div className="card mb-6 flex flex-col gap-4 p-6 md:flex-row">
                    <div className="flex-1">
                        <label htmlFor="dir-search" className="label">Cari Sekolah</label>
                        <input
                            id="dir-search"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input"
                            placeholder="Ketik nama sekolah…"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label htmlFor="dir-region" className="label">Wilayah</label>
                        <select
                            id="dir-region"
                            value={regionId}
                            onChange={(e) => setRegionId(e.target.value)}
                            className="input"
                        >
                            <option value="">Semua Wilayah</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleFilter} className="btn-primary px-8 py-2.5">
                            Terapkan
                        </button>
                    </div>
                </div>

                {/* Schools table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-container-low text-xs font-bold uppercase text-ink-soft">
                                <tr>
                                    <th className="px-6 py-3.5">Nama Sekolah</th>
                                    <th className="px-6 py-3.5">NPSN</th>
                                    <th className="px-6 py-3.5 text-center">Total Kuota</th>
                                    <th className="px-6 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {schools.data.map((school) => (
                                    <tr key={school.id} className="transition-colors hover:bg-surface-container-low">
                                        <td className="px-6 py-4 font-bold text-ink">{school.name}</td>
                                        <td className="px-6 py-4 font-mono text-ink-soft">{school.npsn}</td>
                                        <td className="px-6 py-4 text-center font-bold text-brand-700">
                                            {school.quotas.reduce((sum, q) => sum + q.kuota, 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => alert(`Detail Kuota ${school.name}:\n` + school.quotas.map(q => `${q.path.name}: ${q.kuota}`).join('\n'))}
                                                className="cursor-pointer text-xs font-bold text-brand-700 hover:underline"
                                            >
                                                Lihat Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-6 py-3.5">
                        <span className="text-xs text-ink-faint">
                            Menampilkan {schools.from} sampai {schools.to} dari {schools.total} sekolah
                        </span>
                        <div className="flex gap-2">
                            {schools.links.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.get(link.url)}
                                    disabled={link.active || !link.url}
                                    className={`cursor-pointer rounded-8 px-3 py-1 text-xs font-bold transition-colors ${
                                        link.active
                                            ? 'bg-brand-700 text-white'
                                            : 'border border-outline-variant bg-white text-ink hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}