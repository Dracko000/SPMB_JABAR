import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

const sections = [
    ['overview', 'Ringkasan'],
    ['quota', 'Kelola Kuota'],
    ['selection', 'Seleksi'],
    ['registrations', 'Daftar Pendaftar'],
    ['complaints', 'Pengaduan'],
];

export default function Dashboard({ period, quotas, selections, registrations, complaints, schools = [], selectionRules = [], selectionResults = [], selectionPreview }) {
    const { flash } = usePage().props;
    const [tab, setTab] = useState('overview');

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold text-cemara">Panel Admin</h1>
                <p className="text-sm text-ink-faint">
                    Periode aktif: {period ? `${period.year} (${period.registration_start} s/d ${period.registration_end})` : 'tidak ada'}
                </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5 border-b border-outline-variant pb-px">
                {sections.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`rounded-t-8 px-4 py-2 text-sm font-semibold transition ${tab === key ? 'bg-brand-700 text-white' : 'text-ink-soft hover:bg-surface-container-low'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === 'overview' && <Overview quotas={quotas} selections={selections} registrations={registrations} />}
                {tab === 'quota' && <QuotaTab quotas={quotas} />}
                {tab === 'selection' && <SelectionTab selections={selections} schools={schools} selectionRules={selectionRules} selectionResults={selectionResults} selectionPreview={selectionPreview} />}
                {tab === 'registrations' && <RegistrationsTab registrations={registrations} />}
                {tab === 'complaints' && <ComplaintsTab complaints={complaints} />}
            </div>
        </AppLayout>
    );
}

function Overview({ quotas, selections, registrations }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Kuota Jalur per Sekolah">
                {quotas.slice(0, 6).map((q) => (
                    <li key={q.id} className="py-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-ink">{q.school?.name}</span>
                            <span className="text-ink-faint">{q.path?.name}</span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-surface-container overflow-hidden">
                            <div className="h-full bg-brand-700 rounded-full" style={{ width: `${Math.min((q.terisi / q.kuota) * 100, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-ink-faint">{q.terisi}/{q.kuota} terisi</p>
                    </li>
                ))}
            </Panel>

            <Panel title="Seleksi">
                <div className="space-y-2">
                    {selections.slice(0, 8).map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-8 bg-surface-container-low px-3 py-2 text-sm">
                            <span className="font-medium text-ink">{s.registration?.student?.nama}</span>
                            <span className="text-ink-faint">{s.school?.name}</span>
                            <Badge status={s.status} />
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    );
}

function QuotaTab({ quotas }) {
    const { errors, schools = [], paths = [] } = usePage().props;
    const [form, setForm] = useState({ school_id: schools[0]?.id ?? 0, path_id: paths[0]?.id ?? 0, kuota: 100 });

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = (e) => {
        e.preventDefault();
        router.post('/admin/kuota', form, { preserveScroll: true });
    };

    return (
        <Panel title="Atur Kuota Jalur-Sekolah">
            <form onSubmit={save} className="flex flex-wrap gap-3">
                <select value={form.school_id} onChange={(e) => set('school_id', parseInt(e.target.value))}
                        className="rounded-8 border border-outline-variant px-3 py-2 text-sm">
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={form.path_id} onChange={(e) => set('path_id', parseInt(e.target.value))}
                        className="rounded-8 border border-outline-variant px-3 py-2 text-sm">
                    {paths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" value={form.kuota} onChange={(e) => set('kuota', parseInt(e.target.value))}
                       className="w-24 rounded-8 border border-outline-variant px-3 py-2 text-sm" placeholder="Kuota" />
                <button className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white">Simpan</button>
            </form>

            <table className="mt-5 w-full text-sm">
                <thead>
                <tr className="border-b border-outline-variant text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-3">Sekolah</th>
                    <th className="py-2 pr-3">Jalur</th>
                    <th className="py-2 pr-3">Kuota</th>
                    <th className="py-2">Terisi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                {quotas.map((q) => (
                    <tr key={q.id}>
                        <td className="py-2.5 pr-3 font-medium text-ink">{q.school?.name}</td>
                        <td className="py-2.5 pr-3 text-ink-soft">{q.path?.name}</td>
                        <td className="py-2.5 pr-3">{q.kuota}</td>
                        <td className="py-2.5">{q.terisi}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            {errors.kuota && <p className="mt-2 text-sm text-error">{errors.kuota}</p>}
        </Panel>
    );
}

function SelectionTab({ selections, selectionRules = [], selectionResults = [], selectionPreview, schools = [] }) {
    const { errors } = usePage().props;
    const [ruleDraft, setRuleDraft] = useState({});

    const schoolName = (schoolId) => schools.find((x) => x.id === schoolId)?.name ?? `Sekolah #${schoolId}`;

    const saveRule = (pathId, e) => {
        e.preventDefault();
        router.post('/admin/seleksi/rules', { path_id: pathId, ...ruleDraft[pathId] }, { preserveScroll: true });
    };

    const dryRun = () => router.post('/admin/seleksi/dry-run', {}, { preserveScroll: true });
    const publish = () => router.post('/admin/seleksi/publish', {}, { preserveScroll: true });

    return (
        <Panel title="Seleksi Pendaftar">
            <div className="space-y-5">
                {/* Rules editor */}
                <div>
                    <h4 className="font-semibold text-ink">Aturan per Jalur</h4>
                    <div className="mt-3 space-y-3">
                        {selectionRules.map((r) => (
                            <form key={r.id} onSubmit={(e) => saveRule(r.path_id, e)} className="rounded-8 border border-outline-variant p-3">
                                <div className="flex flex-wrap items-end gap-3 text-sm">
                                    <span className="font-medium text-ink">{r.path?.name ?? `Jalur #${r.path_id}`}</span>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Bobot Nilai</span>
                                        <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.path_id]?.score_weight ?? r.score_weight}
                                               onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], score_weight: parseFloat(e.target.value) } }))}
                                               className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Bobot Jarak</span>
                                        <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.path_id]?.distance_weight ?? r.distance_weight}
                                               onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], distance_weight: parseFloat(e.target.value) } }))}
                                               className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Tie-break</span>
                                        <select value={ruleDraft[r.path_id]?.tie_break ?? r.tie_break}
                                                onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], tie_break: e.target.value } }))}
                                                className="rounded-8 border border-outline-variant px-2 py-1.5">
                                            <option value="date_submitted_asc">Tanggal submit awal</option>
                                            <option value="age_youngest">Usia termuda</option>
                                        </select>
                                    </label>
                                    <button className="rounded-8 bg-brand-700 px-3 py-1.5 text-xs font-bold text-white">Simpan</button>
                                </div>
                            </form>
                        ))}
                    </div>
                    {errors.score_weight && <p className="mt-1 text-sm text-error">{errors.score_weight}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={dryRun} className="rounded-8 bg-surface-container-low border border-outline-variant px-4 py-2 text-sm font-bold text-ink">Hitung (dry-run)</button>
                    <button onClick={publish} className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">Publikasikan Hasil</button>
                </div>

                {/* Preview */}
                {selectionPreview && (
                    <div className="rounded-8 border border-outline-variant">
                        <div className="border-b border-outline-variant px-4 py-3 font-semibold text-ink">Pratinjau Hasil per Sekolah</div>
                        {selectionPreview.schools?.length === 0 ? (
                            <p className="p-4 text-sm text-ink-faint">Tidak ada pendaftar terverifikasi untuk jalur aktif.</p>
                        ) : (
                            selectionPreview.schools.map((s) => (
                                <div key={s.school_id} className="px-4 py-3 border-b border-outline-variant last:border-0">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-ink">{schoolName(s.school_id)}</span>
                                        <span className="text-xs text-ink-faint">{s.rows.length} diterima</span>
                                    </div>
                                    <ol className="mt-2 text-sm text-ink-soft">
                                        {s.rows.map((r, i) => (
                                            <li key={i} className="flex justify-between py-0.5">
                                                <span>#{r.rank} · {r.nama ?? `Pendaftar ${r.registration_id}`}</span>
                                                <span className="font-mono text-xs">{r.score}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Published results */}
                {selectionResults.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-outline-variant text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                            <th className="py-2 pr-3">Sekolah</th>
                            <th className="py-2 pr-3">Pendaftar</th>
                            <th className="py-2 pr-3">Skor</th>
                            <th className="py-2">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                        {selectionResults.map((r) => (
                            <tr key={r.id}>
                                <td className="py-2.5 pr-3 font-medium text-ink">{schoolName(r.school_id)}</td>
                                <td className="py-2.5 pr-3 text-ink-soft">{r.registration?.student?.nama}</td>
                                <td className="py-2.5 pr-3 font-mono text-xs">{r.composite_score}</td>
                                <td className="py-2.5"><Badge status={r.status} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {/* Legacy flat results */}
                {selectionPreview == null && selections.length > 0 && (
                    <div className="text-sm text-ink-faint">{selections.length} hasil seleksi tersimpan.</div>
                )}
            </div>
        </Panel>
    );
}

function RegistrationsTab({ registrations }) {
    return (
        <Panel title={`Daftar Pendaftar (${registrations.length})`}>
            <table className="w-full text-sm">
                <thead>
                <tr className="border-b border-outline-variant text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-3">No. Pendaftaran</th>
                    <th className="py-2 pr-3">Nama</th>
                    <th className="py-2 pr-3">Jalur</th>
                    <th className="py-2">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                {registrations.map((r) => (
                    <tr key={r.id}>
                        <td className="py-2.5 pr-3 font-mono text-xs">{r.no_pendaftaran}</td>
                        <td className="py-2.5 pr-3 font-medium text-ink">{r.student?.nama}</td>
                        <td className="py-2.5 pr-3 text-ink-soft">{r.path?.name}</td>
                        <td className="py-2.5"><Badge status={r.status} /></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Panel>
    );
}

function ComplaintsTab({ complaints }) {
    return (
        <Panel title={`Pengaduan (${complaints.length})`}>
            <div className="md:hidden space-y-3">
                {complaints.map((c) => (
                    <div key={c.id} className="rounded-8 border border-outline-variant p-3">
                        <div className="flex items-center gap-2"><span className="font-mono text-xs">{c.ticket_no}</span><Badge status={c.status} /></div>
                        <p className="mt-1 font-semibold text-ink">{c.subject}</p>
                    </div>
                ))}
            </div>
            <table className="w-full text-sm max-md:hidden">
                <thead>
                <tr className="border-b border-outline-variant text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-3">Tiket</th>
                    <th className="py-2 pr-3">Perihal</th>
                    <th className="py-2 pr-3">Pengadu</th>
                    <th className="py-2">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                {complaints.map((c) => (
                    <tr key={c.id}>
                        <td className="py-2.5 pr-3 font-mono text-xs">{c.ticket_no}</td>
                        <td className="py-2.5 pr-3 font-medium text-ink">{c.subject}</td>
                        <td className="py-2.5 pr-3 text-ink-soft">{c.user?.name}</td>
                        <td className="py-2.5"><Badge status={c.status} /></td>
                    </tr>
                ))}
                </tbody>
            </table>
        </Panel>
    );
}

function Panel({ title, children }) {
    return (
        <div className="rounded-8 border border-outline-variant bg-white px-5 py-4">
            <h3 className="font-bold text-ink">{title}</h3>
            <div className="mt-3">{children}</div>
        </div>
    );
}

