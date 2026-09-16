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
        router.post('/pendaftaran/path', { path_code: id }, { preserveScroll: true });
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

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold text-cemara">Pendaftaran Murid Baru {registration?.period?.year ?? ''}</h1>
                <p className="text-sm text-ink-faint">
                    No. Pendaftaran: <span className="font-mono font-semibold">{registration.no_pendaftaran}</span>
                </p>
            </div>

            {/* Step indicator */}
            <div className="mt-6 flex gap-2 sm:gap-3">
                {STEPS.map((label, i) => {
                    const n = i + 1;
                    const done = n < active;
                    const current = n === active;
                    return (
                        <div key={label} className="flex-1">
                            <div className={`h-1.5 rounded-full ${current ? 'bg-brand-700' : done ? 'bg-brand-300' : 'bg-outline-variant'}`} />
                            <p className={`mt-1.5 text-[11px] font-semibold ${current ? 'text-brand-700' : done ? 'text-brand-600' : 'text-ink-faint'}`}>
                                {n}. {label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {errors.submit && (
                <div className="mt-4 rounded-8 border border-error-container bg-error-container px-4 py-3 text-sm text-error">
                    {errors.submit}
                </div>
            )}

            {/* Step 1 — jalur */}
            <section className={`mt-6 ${active === 1 ? '' : 'hidden'}`}>
                <h2 className="font-bold text-ink">Pilih Jalur Pendaftaran</h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {paths.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPathCode(p.code)}
                            className={`rounded-8 border-2 px-5 py-4 text-left transition ${pathCode === p.code ? 'border-brand-700 bg-brand-50' : 'border-outline-variant bg-white hover:border-brand-300'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-ink">{p.name}</span>
                                {registration.path?.id === p.id && <Badge status="verified" />}
                            </div>
                            <p className="mt-1 text-xs text-ink-faint">{p.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {p.requirements.map((r) => (
                                    <span key={r.code} className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-ink-soft">
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
                <div className="mt-5 flex justify-end">
                    <button
                        onClick={() => pick(pathCode)}
                        disabled={!pathCode}
                        className="rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-40"
                    >
                        Simpan Jalur
                    </button>
                </div>
            </section>

            {/* Step 2 — sekolah */}
            <section className={`mt-6 ${active === 2 ? '' : 'hidden'}`}>
                <h2 className="font-bold text-ink">Pilih Sekolah Tujuan (maks. 5, sesuai prioritas)</h2>
                <p className="mt-1 text-xs text-ink-faint">Klik untuk menambah ke pilihan, urut sesuai prioritas 1–5.</p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                className={`rounded-8 border-2 px-4 py-3 text-left transition ${chosen ? 'border-brand-700 bg-brand-50' : 'border-outline-variant bg-white hover:border-brand-300'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-ink">{s.name}</span>
                                    {chosen && (
                                        <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-bold text-white">
                                            Pilihan {idx + 1}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-ink-faint">{s.region?.name}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex justify-between">
                    <button onClick={() => setActive(1)} className="rounded-8 border border-outline-variant px-4 py-2 text-sm font-semibold text-ink-soft hover:border-brand-700">← Kembali</button>
                    <button
                        onClick={() => { saveSchools(); setActive(3); }}
                        disabled={schoolIds.length === 0}
                        className="rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-40"
                    >
                        Simpan & Lanjut
                    </button>
                </div>
            </section>

            {/* Step 3 — dokumen */}
            <section className={`mt-6 ${active === 3 ? '' : 'hidden'}`}>
                <h2 className="font-bold text-ink">Upload Dokumen</h2>
                <p className="mt-1 text-xs text-ink-faint">Lampirkan dokumen sesuai jalur yang dipilih (PDF/JPG/PNG, maks. 4MB)</p>

                <div className="mt-4 space-y-3">
                    {typeof registration.documents !== 'undefined' && registration.documents.map((d) => (
                        <div key={d.id} className="flex items-center justify-between rounded-8 border border-outline-variant bg-white px-4 py-3 text-sm">
                            <span className="font-semibold text-ink">{d.type}</span>
                            <Badge status={d.status} />
                        </div>
                    ))}
                </div>

                <DocUploadForm path={registration.path} />

                <div className="mt-5 flex justify-between">
                    <button onClick={() => setActive(2)} className="rounded-8 border border-outline-variant px-4 py-2 text-sm font-semibold text-ink-soft hover:border-brand-700">← Kembali</button>
                    <button onClick={() => setActive(4)} className="rounded-8 bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800">
                        Lanjut ke Review
                    </button>
                </div>
            </section>

            {/* Step 4 — review & submit */}
            <section className={`mt-6 ${active === 4 ? '' : 'hidden'}`}>
                <h2 className="font-bold text-ink">Review Pendaftaran</h2>

                <div className="mt-3 rounded-8 border border-outline-variant bg-white divide-y divide-outline-variant">
                    <div className="px-5 py-3.5 text-sm"><span className="text-ink-soft">Jalur:</span> <strong className="text-ink">{registration.path?.name ?? '—'}</strong></div>
                    <div className="px-5 py-3.5 text-sm">
                        <span className="text-ink-soft">Sekolah tujuan:</span>{' '}
                        <strong className="text-ink">
                            {registration.choices?.length
                                ? registration.choices.map((c) => `${c.priority}. ${c.school?.name}`).join(' · ')
                                : '—'}
                        </strong>
                    </div>
                    <div className="px-5 py-3.5 text-sm">
                        <span className="text-ink-soft">Status:</span> <Badge status={registration.status} />
                    </div>
                </div>

                <div className="mt-6 rounded-8 border border-brand-700 bg-brand-50 px-5 py-4">
                    <p className="text-sm text-brand-800">
                        Dengan menekan tombol Kirim, Anda menyetujui pendaftaran ini dan kuota sekolah akan langsung
                        dicadangkan. Periksa kembali data sebelum mengirim.
                    </p>
                </div>

                <div className="mt-5 flex justify-between">
                    <button onClick={() => setActive(3)} className="rounded-8 border border-outline-variant px-4 py-2 text-sm font-semibold text-ink-soft hover:border-brand-700">← Kembali</button>
                    <button
                        onClick={submit}
                        disabled={registration.status === 'submitted'}
                        className="rounded-8 bg-brand-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-40"
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
    const [type, setType] = useState(path?.requirements?.[0]?.code ?? 'akte');
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
        <form onSubmit={upload} className="mt-4 rounded-8 border border-outline-variant bg-white p-5">
            <label className="text-xs font-semibold text-ink-soft">Jenis Dokumen</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
                    className="mt-2 w-full rounded-8 border border-outline-variant px-3 py-2 text-sm focus:border-brand-700 focus:outline-none">
                {(path?.requirements ?? []).map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                ))}
            </select>
            <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-3 w-full text-sm text-ink-soft file:mr-3 file:rounded-8 file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <button type="submit" disabled={!file}
                    className="mt-4 rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-40">
                Upload
            </button>
            {errors.type && <p className="mt-2 text-sm text-error">{errors.type}</p>}
        </form>
    );
}