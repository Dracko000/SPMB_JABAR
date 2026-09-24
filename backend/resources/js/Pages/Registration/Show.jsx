import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

const STEPS = ['Pilih Jalur', 'Pilih Sekolah', 'Upload Dokumen', 'Review & Submit'];

export default function Show({ registration, paths, schools, step }) {
    const { flash, errors } = usePage().props;
    const [active, setActive] = useState(Math.min(step ?? 1, 4));
    const [pathCode, setPathCode] = useState(registration?.path?.code ?? '');
    const [schoolIds, setSchoolIds] = useState(
        registration?.choices?.map((c) => c.school_id) ?? [],
    );

    const pick = (id) => {
        router.post('/pendaftaran/path', { path_code: id }, {
            preserveScroll: false,
            onSuccess: () => setActive(2),
        });
    };

    const saveSchools = () => {
        if (schoolIds.length === 0) return;
        router.post('/pendaftaran/choices', { school_ids: schoolIds }, { preserveScroll: true });
    };

    const submit = () => {
        router.post('/pendaftaran/submit', {}, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-cemara">
                    Pendaftaran Murid Baru {registration?.period?.year ?? ''}
                </h1>
                <p className="mt-1 text-sm text-ink-soft">
                    No. Pendaftaran: <span className="font-mono font-bold text-ink">{registration.no_pendaftaran}</span>
                </p>
            </div>

            {/* Stepper */}
            <div className="mt-8 flex items-start">
                {STEPS.map((label, i) => {
                    const n = i + 1;
                    const done = n < active;
                    const current = n === active;
                    return (
                        <div key={label} className={`flex flex-1 items-start ${i === 0 ? '' : 'gap-3'}`}>
                            {i > 0 && (
                                <div className={`mt-4 h-px flex-1 ${done || current ? 'bg-brand-400' : 'bg-outline-variant'}`} aria-hidden="true" />
                            )}
                            <div className="flex flex-col items-center text-center">
                                <span
                                    className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                                        done
                                            ? 'bg-brand-700 text-white'
                                            : current
                                                ? 'bg-brand-700 text-white ring-4 ring-brand-100'
                                                : 'border border-outline bg-white text-ink-faint'
                                    }`}
                                >
                                    {done ? '✓' : n}
                                </span>
                                <span className={`mt-2 max-w-[90px] text-[11px] font-bold leading-tight ${current ? 'text-brand-800' : done ? 'text-brand-700' : 'text-ink-faint'}`}>
                                    {label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {errors.submit && (
                <div className="mt-6 rounded-8 border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-error">
                    {errors.submit}
                </div>
            )}

            {/* Step 1 — jalur */}
            <section className={`mt-8 ${active === 1 ? '' : 'hidden'}`}>
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-ink">Pilih Jalur Pendaftaran</h2>
                    <p className="mt-1 text-sm text-ink-soft">Pilih jalur yang sesuai dengan kondisi calon siswa.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {paths.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPathCode(p.code)}
                            className={`rounded-8 border p-5 text-left transition-colors ${pathCode === p.code ? 'border-brand-700 bg-brand-50' : 'border-outline-variant bg-white hover:border-brand-400'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`font-bold ${pathCode === p.code ? 'text-brand-800' : 'text-ink'}`}>{p.name}</span>
                                {registration.path?.id === p.id && <Badge status="verified" />}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.description}</p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {p.requirements.map((r) => (
                                    <span key={r.code} className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    <button onClick={() => pick(pathCode)} disabled={!pathCode} className="btn-primary px-8 py-3">
                        Simpan Jalur
                    </button>
                </div>
                {errors.path && <p className="mt-3 text-right text-xs font-medium text-error">{errors.path}</p>}
            </section>

            {/* Step 2 — sekolah */}
            <section className={`mt-8 ${active === 2 ? '' : 'hidden'}`}>
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-ink">Pilih Sekolah Tujuan</h2>
                    <p className="mt-1 text-sm text-ink-soft">Pilih maksimal 5 sekolah. Urutan pemilihan menentukan prioritas.</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {schools.map((s) => {
                        const idx = schoolIds.indexOf(s.id);
                        const chosen = idx >= 0;
                        return (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setSchoolIds((ids) =>
                                        chosen ? ids.filter((x) => x !== s.id) : (ids.length >= 5 ? ids : [...ids, s.id]),
                                    );
                                }}
                                className={`rounded-8 border p-4 text-left transition-colors ${chosen ? 'border-brand-700 bg-brand-50' : 'border-outline-variant bg-white hover:border-brand-400'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`font-bold ${chosen ? 'text-brand-800' : 'text-ink'}`}>{s.name}</span>
                                    {chosen && (
                                        <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
                                            Prioritas {idx + 1}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-ink-soft">{s.region?.name}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-between">
                    <button onClick={() => setActive(1)} className="btn-outline px-6 py-2.5">
                        ← Kembali
                    </button>
                    <button
                        onClick={() => { saveSchools(); setActive(3); }}
                        disabled={schoolIds.length === 0}
                        className="btn-primary px-8 py-2.5"
                    >
                        Simpan & Lanjut
                    </button>
                </div>
            </section>

            {/* Step 3 — dokumen */}
            <section className={`mt-8 ${active === 3 ? '' : 'hidden'}`}>
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-ink">Unggah Dokumen Persyaratan</h2>
                    <p className="mt-1 text-sm text-ink-soft">Lampirkan dokumen pendukung dalam format PDF/JPG/PNG (maks. 4MB).</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="space-y-3 lg:col-span-2">
                        {typeof registration.documents !== 'undefined' && registration.documents.map((d) => (
                            <div key={d.id} className="card flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-8 bg-surface-container text-ink-soft">
                                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-ink">{d.type}</span>
                                </div>
                                <Badge status={d.status} />
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <DocUploadForm path={registration.path} />
                    </div>
                </div>

                <div className="mt-8 flex justify-between">
                    <button onClick={() => setActive(2)} className="btn-outline px-6 py-2.5">
                        ← Kembali
                    </button>
                    <button onClick={() => setActive(4)} className="btn-primary px-8 py-2.5">
                        Review Pendaftaran
                    </button>
                </div>
            </section>

            {/* Step 4 — review & submit */}
            <section className={`mt-8 ${active === 4 ? '' : 'hidden'}`}>
                <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-tight text-ink">Konfirmasi Pendaftaran</h2>
                    <p className="mt-1 text-sm text-ink-soft">Periksa kembali seluruh data Anda sebelum mengirimkan pendaftaran.</p>
                </div>

                <div className="card divide-y divide-outline-variant overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-sm font-medium text-ink-soft">Jalur Pendaftaran</span>
                        <strong className="text-sm font-bold text-ink">{registration.path?.name ?? '—'}</strong>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-sm font-medium text-ink-soft">Sekolah Tujuan</span>
                        <strong className="text-right text-sm font-bold text-ink">
                            {registration.choices?.length
                                ? registration.choices.map((c) => `${c.priority}. ${c.school?.name}`).join(' · ')
                                : '—'}
                        </strong>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-sm font-medium text-ink-soft">Status Berkas</span>
                        <Badge status={registration.status} />
                    </div>
                </div>

                <div className="mt-8 rounded-8 border border-brand-100 bg-brand-50 p-6">
                    <div className="flex gap-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm leading-relaxed text-brand-900">
                            Dengan menekan tombol Kirim, Anda menyetujui pendaftaran ini dan kuota sekolah akan langsung
                            dicadangkan. Pastikan semua dokumen telah terunggah dengan benar.
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex justify-between">
                    <button onClick={() => setActive(3)} className="btn-outline px-6 py-2.5">
                        ← Kembali
                    </button>
                    <button
                        onClick={submit}
                        disabled={registration.status === 'submitted'}
                        className="btn-primary px-10 py-2.5"
                    >
                        {registration.status === 'submitted' ? 'Sudah Dikirim' : 'Kirim Pendaftaran'}
                    </button>
                </div>
            </section>
        </AppLayout>
    );
}

function DocUploadForm({ path }) {
    const { errors } = usePage().props;
    const [type, setType] = useState(path?.requirements?.[0]?.code ?? 'KK');
    const [file, setFile] = useState(null);

    const upload = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('type', type);
        fd.append('file', file);
        router.post('/pendaftaran/documents', fd, {
            preserveScroll: true,
            onSuccess: () => setFile(null),
        });
    };

    return (
        <form onSubmit={upload} className="card p-6">
            <h3 className="text-sm font-bold text-ink">Tambah Dokumen</h3>
            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="doc-type" className="label">Jenis Dokumen</label>
                    <select
                        id="doc-type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="input"
                    >
                        {(path?.requirements ?? []).map((r) => (
                            <option key={r.code} value={r.code}>{r.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="doc-file" className="label">Pilih File</label>
                    <input
                        id="doc-file"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="mt-1.5 w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-8 file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-brand-800"
                    />
                </div>
                <button type="submit" disabled={!file} className="btn-primary w-full py-2.5">
                    Unggah Dokumen
                </button>
                {errors.type && <p className="text-xs font-medium text-error">{errors.type}</p>}
            </div>
        </form>
    );
}