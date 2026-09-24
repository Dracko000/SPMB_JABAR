import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

const sections = [
    ['overview', 'Ringkasan'],
    ['analytics', 'Analisis'],
    ['periode', 'Jadwal Jalur'],
    ['quota', 'Kelola Kuota'],
    ['quota_requests', 'Pengajuan Kuota'],
    ['selection', 'Seleksi'],
    ['registrations', 'Daftar Pendaftar'],
    ['complaints', 'Pengaduan'],
    ['audit', 'Audit Log'],
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

            <div className="mt-5 flex gap-6 overflow-x-auto border-b border-outline-variant no-scrollbar">
                {sections.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`-mb-px whitespace-nowrap border-b-2 pt-1 pb-2.5 text-sm font-semibold transition-colors ${tab === key ? 'border-brand-700 text-brand-800' : 'border-transparent text-ink-faint hover:text-ink'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === 'overview' && <Overview stats={usePage().props.stats} pathDistribution={usePage().props.pathDistribution} quotas={quotas} selections={selections} registrations={registrations} />}
                {tab === 'analytics' && <AnalyticsTab stats={usePage().props.stats} funnel={usePage().props.funnel} regionalDemand={usePage().props.regionalDemand} bottlenecks={usePage().props.verificationBottlenecks} />}
                {tab === 'periode' && <PeriodTab period={period} />}
                {tab === 'quota' && <QuotaTab quotas={quotas} />}
                {tab === 'quota_requests' && <QuotaRequestsTab quotaRequests={usePage().props.quotaRequests} />}
                {tab === 'selection' && <SelectionTab selections={selections} schools={schools} selectionRules={selectionRules} selectionResults={selectionResults} selectionPreview={selectionPreview} />}
                {tab === 'registrations' && <RegistrationsTab registrations={registrations} />}
                {tab === 'complaints' && <ComplaintsTab complaints={complaints} />}
                {tab === 'audit' && <AuditTab logs={usePage().props.auditLogs} />}
            </div>
        </AppLayout>
    );
}

function PeriodTab({ period }) {
    const { errors } = usePage().props;
    const [paths, setPaths] = useState(usePage().props.paths || []);
    const [formValues, setFormValues] = useState({});
    const [distForm, setDistForm] = useState([]);
    const [activeMode, setActiveMode] = useState('schedule'); // 'schedule' or 'distribution'

    const saveDistribution = (e) => {
        e.preventDefault();
        router.post('/admin/periode/distribution', {
            distribution: distForm
        }, { preserveScroll: true });
    };

    const updateDistPercentage = (index, val) => {
        const newDist = [...distForm];
        newDist[index].percentage = parseFloat(val) || 0;
        setDistForm(newDist);
    };

    // Initialize distribution form when switching to distribution mode
    useEffect(() => {
        if (activeMode === 'distribution' && distForm.length === 0) {
            setDistForm(paths.map(p => ({ path_id: p.id, percentage: 0 })));
        }
    }, [activeMode, paths]);

    return (
        <Panel title="Pengaturan Periode & Jalur">
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveMode('schedule')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeMode === 'schedule' ? 'bg-brand-700 text-white' : 'bg-white border border-outline-variant text-ink'}`}
                >
                    Jadwal Jalur
                </button>
                <button
                    onClick={() => setActiveMode('distribution')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeMode === 'distribution' ? 'bg-brand-700 text-white' : 'bg-white border border-outline-variant text-ink'}`}
                >
                    Distribusi Global (%)
                </button>
            </div>

            {activeMode === 'schedule' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paths.map((p) => (
                            <form
                                key={p.id}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.post('/admin/periode/update', {
                                        path_id: p.id,
                                        registration_start: formValues[p.id]?.registration_start || p.registration_start?.split('T')[0],
                                        registration_end: formValues[p.id]?.registration_end || p.registration_end?.split('T')[0],
                                    }, { preserveScroll: true });
                                }}
                                className="space-y-4"
                            >
                                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-2">
                                    <span className="font-bold text-ink text-sm">{p.name}</span>
                                    <Badge status={p.registration_end && new Date(p.registration_end) < new Date() ? 'rejected' : 'success'} />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-ink-soft">Tanggal Buka</label>
                                        <input
                                            type="date"
                                            value={formValues[p.id]?.registration_start || p.registration_start?.split('T')[0] || ''}
                                            onChange={e => setFormValues({ ...formValues, [p.id]: { ...formValues[p.id], registration_start: e.target.value } })}
                                            className="w-full rounded-8 border border-outline-variant px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-semibold text-ink-soft">Tanggal Tutup</label>
                                        <input
                                            type="date"
                                            value={formValues[p.id]?.registration_end || p.registration_end?.split('T')[0] || ''}
                                            onChange={e => setFormValues({ ...formValues, [p.id]: { ...formValues[p.id], registration_end: e.target.value } })}
                                            className="w-full rounded-8 border border-outline-variant px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <button className="w-full rounded-8 bg-brand-700 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800 transition-colors">
                                    Simpan Jalur
                                </button>
                            </form>
                        ))}
                    </div>
                    {errors.registration_end && <p className="text-xs text-error font-medium">{errors.registration_end}</p>}
                </div>
            ) : (
                <div className="max-w-3xl space-y-6">
                    <p className="text-sm text-ink-soft">Tentukan persentase alokasi kuota untuk setiap jalur. Persentase ini akan berlaku otomatis saat menyetujui pengajuan kuota sekolah.</p>
                    <form onSubmit={saveDistribution} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {distForm.map((item, idx) => {
                                const path = paths.find(p => p.id === item.path_id);
                                return (
                                    <div key={item.path_id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-outline-variant">
                                        <span className="text-sm font-medium text-ink">{path?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.percentage}
                                                onChange={e => updateDistPercentage(idx, e.target.value)}
                                                className="w-20 rounded-8 border border-outline-variant px-2 py-1 text-sm text-center"
                                            />
                                            <span className="text-sm font-bold text-ink">%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                            <div className="text-sm">
                                Total: <span className={`font-bold ${distForm.reduce((sum, i) => sum + i.percentage, 0) === 100 ? 'text-brand-600' : 'text-flag-red'}`}>
                                    {distForm.reduce((sum, i) => sum + i.percentage, 0)}%
                                </span>
                            </div>
                            <button
                                type="submit"
                                disabled={distForm.reduce((sum, i) => sum + i.percentage, 0) !== 100}
                                className="bg-brand-700 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-800 disabled:opacity-50"
                            >
                                Simpan Distribusi Global
                            </button>
                        </div>
                        {errors.distribution && <p className="text-sm text-error font-medium">{errors.distribution}</p>}
                    </form>
                </div>
            )}
        </Panel>
    );
}

function QuotaRequestsTab({ quotaRequests }) {
    const { errors } = usePage().props;
    const [notes, setNotes] = useState('');

    const process = (id, status) => {
        router.post('/admin/kuota/process', {
            quota_request_id: id,
            status: status,
            notes: notes,
        }, {
            preserveScroll: true,
            onSuccess: () => setNotes('')
        });
    };

    return (
        <Panel title="Pengajuan Kuota Sekolah">
            <div className="mb-6 flex gap-3 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Catatan Penolakan/Persetujuan (Opsional)</label>
                    <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full rounded-8 border border-outline-variant px-3 py-2 text-sm"
                        placeholder="Contoh: Kuota terlalu tinggi, harap sesuaikan."
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-surface-container-low">
                        <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
                            <th className="py-2 pr-3 whitespace-nowrap">Sekolah</th>
                            <th className="py-2 pr-3 whitespace-nowrap">Jalur</th>
                            <th className="py-2 pr-3 text-center whitespace-nowrap">Jumlah</th>
                            <th className="py-2 text-right whitespace-nowrap">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {quotaRequests?.length > 0 ? (
                            quotaRequests.map((req) => (
                                <tr key={req.id}>
                                    <td className="py-3 pr-3 font-medium text-ink whitespace-nowrap">{req.school?.name}</td>
                                    <td className="py-3 pr-3 text-ink-soft whitespace-nowrap">{req.path?.name}</td>
                                    <td className="py-3 text-center font-mono whitespace-nowrap">{req.requested_kuota}</td>
                                    <td className="py-3 text-right flex justify-end gap-2 whitespace-nowrap">
                                        <button
                                            onClick={() => process(req.id, 'rejected')}
                                            className="rounded-8 bg-flag-red/10 text-flag-red-deep px-3 py-1.5 text-xs font-bold hover:bg-flag-red/20 transition-colors"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            onClick={() => process(req.id, 'approved')}
                                            className="rounded-8 bg-green-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-700 transition-colors"
                                        >
                                            Setujui
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-12 text-center text-ink-faint italic">Tidak ada pengajuan kuota yang pending.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

function Overview({ stats, pathDistribution, quotas, selections, registrations }) {
    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi">
                    <p className="kpi-label">Total Pendaftar</p>
                    <div className="flex items-baseline gap-2">
                        <span className="kpi-value text-cemara">{stats.total_pendaftar}</span>
                        <span className="text-xs font-medium text-ink-faint">Siswa</span>
                    </div>
                </div>
                <div className="kpi">
                    <p className="kpi-label">Terverifikasi</p>
                    <div className="flex items-baseline gap-2">
                        <span className="kpi-value text-brand-700">{stats.verified_count}</span>
                        <span className="text-xs font-medium text-ink-faint">
                            ({((stats.verified_count / (stats.total_pendaftar || 1)) * 100).toFixed(1)}%)
                        </span>
                    </div>
                </div>
                <div className="kpi">
                    <p className="kpi-label">Butuh Perbaikan</p>
                    <div className="flex items-baseline gap-2">
                        <span className="kpi-value text-warn-700">{stats.revision_count}</span>
                        <span className="text-xs font-medium text-ink-faint">Siswa</span>
                    </div>
                </div>
                <div className="kpi">
                    <p className="kpi-label">Saturasi Kuota</p>
                    <div className="flex items-baseline gap-2">
                        <span className="kpi-value text-brand-700">
                            {((stats.total_terisi / (stats.total_quota || 1)) * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs font-medium text-ink-faint">Provinsi</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Panel title="Distribusi Jalur" className="lg:col-span-1">
                    <div className="space-y-4">
                        {pathDistribution.map((path) => (
                            <div key={path.name} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-ink">{path.name}</span>
                                    <span className="text-ink-faint">{path.percentage}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                                    <div
                                        className="h-full bg-brand-700 rounded-full transition-all duration-500"
                                        style={{ width: `${path.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title="Kuota Jalur per Sekolah" className="lg:col-span-1">
                    <ul className="space-y-2">
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
                    </ul>
                </Panel>

                <Panel title="Seleksi Terbaru" className="lg:col-span-1">
                    <div className="divide-y divide-outline-variant">
                        {selections.slice(0, 8).map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                                <span className="font-medium text-ink">{s.registration?.student?.nama}</span>
                                <span className="text-ink-faint">{s.school?.name}</span>
                                <Badge status={s.status} />
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function QuotaTab({ quotas }) {
    const { errors, schools = [], paths = [] } = usePage().props;
    const [form, setForm] = useState({ school_id: schools[0]?.id ?? 0, path_id: paths[0]?.id ?? 0, kuota: 100 });
    const [distMode, setDistMode] = useState('manual'); // 'manual' or 'global'
    const [distForm, setDistForm] = useState([]);

    useEffect(() => {
        if (distMode === 'global' && distForm.length === 0) {
            setDistForm(paths.map(p => ({ path_id: p.id, percentage: 0 })));
        }
    }, [distMode, paths]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const saveManual = (e) => {
        e.preventDefault();
        router.post('/admin/kuota', form, { preserveScroll: true });
    };

    const saveGlobal = (e) => {
        e.preventDefault();
        router.post('/admin/periode/distribution', {
            distribution: distForm
        }, { preserveScroll: true });
    };

    const updateDistPercentage = (index, val) => {
        const newDist = [...distForm];
        newDist[index].percentage = parseFloat(val) || 0;
        setDistForm(newDist);
    };

    return (
        <Panel title="Kelola Kuota">
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setDistMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${distMode === 'manual' ? 'bg-brand-700 text-white' : 'bg-white border border-outline-variant text-ink'}`}
                >
                    Manual per Sekolah
                </button>
                <button
                    onClick={() => setDistMode('global')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${distMode === 'global' ? 'bg-brand-700 text-white' : 'bg-white border border-outline-variant text-ink'}`}
                >
                    Distribusi Global (%)
                </button>
            </div>

            {distMode === 'manual' ? (
                <>
                    <form onSubmit={saveManual} className="flex flex-wrap gap-3 mb-6">
                        <select value={form.school_id} onChange={(e) => set('school_id', parseInt(e.target.value))}
                                className="flex-1 min-w-[200px] rounded-8 border border-outline-variant px-3 py-2 text-sm">
                            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={form.path_id} onChange={(e) => set('path_id', parseInt(e.target.value))}
                                className="flex-1 min-w-[200px] rounded-8 border border-outline-variant px-3 py-2 text-sm">
                            {paths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="number" min="1" value={form.kuota} onChange={(e) => set('kuota', parseInt(e.target.value))}
                               className="w-24 rounded-8 border border-outline-variant px-3 py-2 text-sm" placeholder="Kuota" />
                        <button className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white">Simpan</button>
                    </form>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-container-low">
                                <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
                                    <th className="py-2 pr-3 whitespace-nowrap">Sekolah</th>
                                    <th className="py-2 pr-3 whitespace-nowrap">Jalur</th>
                                    <th className="py-2 pr-3 whitespace-nowrap">Kuota</th>
                                    <th className="py-2 whitespace-nowrap">Terisi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {quotas.map((q) => (
                                    <tr key={q.id}>
                                        <td className="py-2.5 pr-3 font-medium text-ink whitespace-nowrap">{q.school?.name}</td>
                                        <td className="py-2.5 pr-3 text-ink-soft whitespace-nowrap">{q.path?.name}</td>
                                        <td className="py-2.5 pr-3 whitespace-nowrap">{q.kuota}</td>
                                        <td className="py-2.5 whitespace-nowrap">{q.terisi}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {errors.kuota && <p className="mt-2 text-sm text-error">{errors.kuota}</p>}
                </>
            ) : (
                <div className="max-w-3xl space-y-6">
                    <p className="text-sm text-ink-soft">Atur persentase alokasi kuota global. Ini akan berlaku otomatis saat menyetujui pengajuan kuota sekolah.</p>
                    <form onSubmit={saveGlobal} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {distForm.map((item, idx) => {
                                const path = paths.find(p => p.id === item.path_id);
                                return (
                                    <div key={item.path_id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-outline-variant">
                                        <span className="text-sm font-medium text-ink">{path?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={item.percentage}
                                                onChange={e => updateDistPercentage(idx, e.target.value)}
                                                className="w-20 rounded-8 border border-outline-variant px-2 py-1 text-sm text-center"
                                            />
                                            <span className="text-sm font-bold text-ink">%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                            <div className="text-sm">
                                Total: <span className={`font-bold ${distForm.reduce((sum, i) => sum + i.percentage, 0) === 100 ? 'text-brand-600' : 'text-flag-red'}`}>
                                    {distForm.reduce((sum, i) => sum + i.percentage, 0)}%
                                </span>
                            </div>
                            <button
                                type="submit"
                                disabled={distForm.reduce((sum, i) => sum + i.percentage, 0) !== 100}
                                className="bg-brand-700 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-800 disabled:opacity-50"
                            >
                                Simpan Distribusi Global
                            </button>
                        </div>
                        {errors.distribution && <p className="text-sm text-error font-medium">{errors.distribution}</p>}
                    </form>
                </div>
            )}
        </Panel>
    );
}

function SelectionTab({ selections, selectionRules = [], selectionResults = [], selectionPreview, schools = [] }) {
    const { errors } = usePage().props;
    const [ruleDraft, setRuleDraft] = useState({});

    const schoolName = (schoolId) => {
        if (!schools || !Array.isArray(schools)) return `Sekolah #${schoolId}`;
        return schools.find((x) => x.id === schoolId)?.name ?? `Sekolah #${schoolId}`;
    };

    const saveRule = (pathId, e) => {
        e.preventDefault();
        router.post('/admin/seleksi/rules', { path_id: pathId, ...ruleDraft[pathId] }, { preserveScroll: true, preserveState: true });
    };

    const dryRun = () => router.post('/admin/seleksi/dry-run', {}, { preserveScroll: true, preserveState: true });
    const publish = () => router.post('/admin/seleksi/publish', {}, { preserveScroll: true });

    return (
        <Panel title="Seleksi Pendaftar">
            <div className="space-y-5">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-ink">Aturan per Jalur</h4>
                    <div className="flex gap-3">
                        <a
                            href={`/admin/export-results`}
                            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 transition-colors"
                        >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Ekspor (CSV)
                        </a>
                        <a
                            href={`/admin/export-results-pdf`}
                            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 transition-colors"
                        >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Laporan PDF
                        </a>
                    </div>
                </div>
                <div className="mt-3 space-y-3">
                    {selectionRules.map((r) => (
                        <form key={r.id} onSubmit={(e) => saveRule(r.admission_path_id, e)} className="rounded-8 border border-outline-variant p-3">
                            <div className="flex flex-wrap items-end gap-3 text-sm">
                                <span className="font-medium text-ink">{r.path?.name ?? `Jalur #${r.id}`}</span>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-ink-faint">Bobot Nilai</span>
                                    <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.admission_path_id]?.score_weight ?? r.score_weight}
                                           onChange={(e) => setRuleDraft((d) => ({ ...d, [r.admission_path_id]: { ...d[r.admission_path_id], score_weight: parseFloat(e.target.value) } }))}
                                           className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-ink-faint">Bobot Jarak</span>
                                    <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.admission_path_id]?.distance_weight ?? r.distance_weight}
                                           onChange={(e) => setRuleDraft((d) => ({ ...d, [r.admission_path_id]: { ...d[r.admission_path_id], distance_weight: parseFloat(e.target.value) } }))}
                                           className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-ink-faint">Tie-break</span>
                                    <select value={ruleDraft[r.admission_path_id]?.tie_break ?? r.tie_break}
                                            onChange={(e) => setRuleDraft((d) => ({ ...d, [r.admission_path_id]: { ...d[r.admission_path_id], tie_break: e.target.value } }))}
                                            className="rounded-8 border border-outline-variant px-2 py-1.5">
                                        <option value="date_submitted_asc">Tanggal submit awal</option>
                                        <option value="age_youngest">Usia termuda</option>
                                    </select>
                                </label>
                                <label className="flex items-center gap-1.5">
                                    <input type="checkbox" checked={ruleDraft[r.admission_path_id]?.is_active ?? r.is_active}
                                       onChange={(e) => setRuleDraft((d) => ({ ...d, [r.admission_path_id]: { ...d[r.admission_path_id], is_active: e.target.checked } }))}
                                       className="h-4 w-4 rounded border-outline-variant" />
                                    <span className="text-xs text-ink-faint">Aktif</span>
                                </label>
                                <button className="rounded-8 bg-brand-700 px-3 py-1.5 text-xs font-bold text-white">Simpan</button>
                            </div>
                        </form>
                    ))}
                </div>
                {errors.path_id && <p className="mt-1 text-sm text-error">{errors.path_id}</p>}
                {errors.score_weight && <p className="mt-1 text-sm text-error">{errors.score_weight}</p>}
                {errors.tie_break && <p className="mt-1 text-sm text-error">{errors.tie_break}</p>}

                <div className="flex gap-3">
                    <button onClick={dryRun} className="rounded-8 bg-surface-container-low border border-outline-variant px-4 py-2 text-sm font-bold text-ink">Hitung (dry-run)</button>
                    <button onClick={publish} className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">Publikasikan Hasil</button>
                </div>

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
                                                <span>#{r.rank} · {r.nama ?? '—'}</span>
                                                <span className="font-mono text-xs">{r.score}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {selectionResults.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
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
                <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
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
            <div className="md:hidden divide-y divide-outline-variant">
                {complaints.map((c) => (
                    <div key={c.id} className="py-3">
                        <div className="flex items-center gap-2"><span className="font-mono text-xs">{c.ticket_no}</span><Badge status={c.status} /></div>
                        <p className="mt-1 font-semibold text-ink">{c.subject}</p>
                    </div>
                ))}
            </div>
            <table className="w-full text-sm max-md:hidden">
                <thead>
                <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
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

function AuditTab({ logs }) {
    return (
        <Panel title="Audit Log Sistem">
            <p className="text-sm text-ink-soft mb-6">Catatan seluruh perubahan data kritikal oleh administrator untuk transparansi dan audit keamanan.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-surface-container-low">
                        <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
                            <th className="py-2 pr-3">Waktu</th>
                            <th className="py-2 pr-3">Admin</th>
                            <th className="py-2 pr-3">Event</th>
                            <th className="py-2 pr-3">Objek</th>
                            <th className="py-2 text-right">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {logs?.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low">
                                    <td className="py-3 pr-3 text-ink-faint whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3 pr-3 font-medium text-ink">{log.user?.name ?? 'Sistem'}</td>
                                    <td className="py-3 pr-3">
                                        <Badge status={log.event === 'updated' ? 'success' : 'info'}>
                                            {log.event}
                                        </Badge>
                                    </td>
                                    <td className="py-3 pr-3 text-ink-soft">
                                        {log.auditable_type.replace('App\\Models\\', '')} #{log.auditable_id}
                                    </td>
                                    <td className="py-3 text-right">
                                        <button
                                            onClick={() => alert(`Perubahan:\n\nLama: ${JSON.stringify(log.old_values)}\nBaru: ${JSON.stringify(log.new_values)}`)}
                                            className="text-xs font-bold text-brand-700 hover:underline"
                                        >
                                            Lihat Diff
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-ink-faint italic">Belum ada catatan audit.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Panel>
    );
}

function AnalyticsTab({ stats, funnel, regionalDemand, bottlenecks }) {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-ink">Provincial Analytics</h3>
                <a
                    href="/admin/export-provincial-summary"
                    className="btn-primary px-4 py-2"
                >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H7" />
                    </svg>
                    Ekspor Ringkasan Provinsi
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Panel title="Conversion Funnel">
                    <div className="space-y-4">
                        {funnel.map((step, i) => (
                            <div key={i} className="relative">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-ink">{step.stage}</span>
                                    <span className="font-mono font-bold text-brand-700">{step.count.toLocaleString()}</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                                    <div
                                        className="h-full bg-brand-700 transition-all duration-1000"
                                        style={{ width: `${(step.count / (funnel[0].count || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Bottlenecks */}
                <Panel title="Verification Bottlenecks (Top 10 Schools)">
                    <div className="space-y-3">
                        {bottlenecks.map((b, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant">
                                <div>
                                    <p className="text-sm font-bold text-ink">{b.school_name}</p>
                                    <p className="text-xs text-ink-faint">{b.pending_count} pendaftar pending</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-orange-600">{b.avg_verification_time.toFixed(1)} jam</p>
                                    <p className="text-[10px] text-ink-faint uppercase">Avg. Time</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            {/* Regional Demand Table */}
            <Panel title="Regional Demand & Saturation">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-bold text-ink-soft uppercase">
                            <tr>
                                <th className="px-4 py-3">Wilayah (Kab/Kota)</th>
                                <th className="px-4 py-3 text-center">Pendaftar</th>
                                <th className="px-4 py-3 text-center">Kuota</th>
                                <th className="px-4 py-3 text-right">Saturasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {regionalDemand.map((r, i) => (
                                <tr key={i} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-4 py-3 font-medium text-ink">{r.region_name}</td>
                                    <td className="px-4 py-3 text-center font-mono">{r.pendaftar_count.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center font-mono">{r.quota_count.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-bold ${r.saturation > 100 ? 'text-warn-700' : 'text-brand-700'}`}>
                                            {r.saturation}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}

function Panel({ title, children }) {
    return (
        <div className="card px-5 py-5">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
            <div className="mt-4">{children}</div>
        </div>
    );
}
