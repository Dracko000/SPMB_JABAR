import { Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Badge from '../../Components/Badge';
import FlashMessage from '../../Components/FlashMessage';

export default function Sekolah({ registrations, kpis }) {
    const { auth, flash } = usePage().props;

    return (
        <AppLayout>
            <FlashMessage flash={flash} />

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-extrabold text-cemara">{auth.user.school?.name ?? 'Dashboard Sekolah'}</h1>
                <p className="text-sm text-ink-faint">Pantau pendaftar yang memilih sekolah Anda</p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Total Pendaftar" value={kpis.total} accent />
                <KpiCard label="Menunggu Verifikasi" value={kpis.menunggu} />
                <KpiCard label="Terverifikasi" value={kpis.valid} />
            </div>

            <div className="mt-6 flex items-center justify-between">
                <h2 className="font-bold text-ink">Daftar Pendaftar</h2>
                <Link href="/verifikasi" className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
                    Verifikasi Sekarang
                </Link>
            </div>

            <div className="mt-3 rounded-8 border border-outline-variant bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-outline-variant text-left text-xs font-semibold text-ink-soft">
                        <th className="px-4 py-3">No. Pendaftaran</th>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Jalur</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                    {registrations.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-faint">Belum ada pendaftar.</td></tr>
                    ) : registrations.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-container-low">
                            <td className="px-4 py-3 font-mono text-xs">{r.no_pendaftaran}</td>
                            <td className="px-4 py-3 font-semibold">{r.student?.nama}</td>
                            <td className="px-4 py-3">{r.path?.name}</td>
                            <td className="px-4 py-3"><Badge status={r.status} /></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}

function KpiCard({ label, value, accent = false }) {
    return (
        <div className={`rounded-8 border px-4 py-4 ${accent ? 'border-brand-700 bg-brand-700 text-white' : 'border-outline-variant bg-white'}`}>
            <p className={`text-xs font-semibold ${accent ? 'text-brand-200' : 'text-ink-soft'}`}>{label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
        </div>
    );
}