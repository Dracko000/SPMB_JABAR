import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Downloads({ files }) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', ...new Set(files.map(f => f.category))];

    const filteredFiles = files.filter(file => {
        const matchesSearch = file.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || file.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <AppLayout>
            <Head title="Pusat Unduhan — SPMB JABAR" />
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-cemara">Pusat Unduhan</h1>
                    <p className="mt-3 text-base text-ink-soft">
                        Dokumen resmi, petunjuk teknis, dan pengumuman pendaftaran
                    </p>
                </div>

                {/* Search & filter */}
                <div className="mb-8 flex flex-col gap-4">
                    <div className="flex-1">
                        <label htmlFor="dl-search" className="sr-only">Cari dokumen</label>
                        <input
                            id="dl-search"
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input px-5 py-3"
                            placeholder="Cari dokumen atau kata kunci…"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                                    activeCategory === cat
                                        ? 'bg-brand-700 text-white'
                                        : 'border border-outline-variant bg-white text-ink-soft hover:border-brand-400 hover:text-ink'
                                }`}
                            >
                                {cat === 'All' ? 'Semua' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredFiles.length === 0 ? (
                        <div className="border-2 border-dashed border-outline-variant bg-white py-20 text-center">
                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-container-low text-ink-faint">
                                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8.828a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-ink-soft">
                                Dokumen tidak ditemukan untuk kriteria ini.
                            </p>
                        </div>
                    ) : (
                        filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                className="card flex items-center justify-between gap-4 p-5 transition-colors hover:border-brand-400"
                            >
                                <div className="flex min-w-0 items-center gap-5">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-8 bg-surface-container text-ink-soft">
                                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                                                {file.category}
                                            </span>
                                            {file.version && (
                                                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-100">
                                                    v{file.version}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="truncate text-lg font-bold tracking-tight text-ink">
                                            {file.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-ink-faint">
                                            <span>PDF Format</span>
                                            <span aria-hidden="true">•</span>
                                            <span>Diunggah {new Date(file.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={`/storage/${file.file_path}`}
                                    download
                                    className="btn-outline shrink-0 px-6 py-2.5"
                                >
                                    Unduh
                                </a>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}