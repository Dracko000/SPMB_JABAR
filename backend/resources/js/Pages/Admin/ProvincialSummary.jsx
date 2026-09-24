import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function ProvincialSummary({ data, generated_at }) {
    const { summary, path_breakdown, regional_breakdown } = data;

    return (
        <AppLayout>
            <Head title="Ringkasan Provinsi — SPMB JABAR" />

            {/* Print-only styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                    .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; }
                    .page-break { page-break-before: always; }
                }
            `}} />

            <div className="max-w-5xl mx-auto py-12 px-4 print-container">
                <div className="flex justify-between items-start mb-12 border-b-4 border-brand-700 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-cemara uppercase">Laporan Ringkasan Eksekutif</h1>
                        <p className="text-lg font-bold text-ink-soft">Provinsi Jawa Barat — SPMB SMA 2026</p>
                    </div>
                    <div className="text-right text-sm text-ink-faint">
                        <p>Dicetak pada:</p>
                        <p className="font-bold text-ink">{generated_at}</p>
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100">
                        <p className="text-xs font-bold text-brand-700 uppercase mb-1">Total Pendaftar</p>
                        <p className="text-4xl font-black text-cemara">{summary.total_pendaftar.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-brand-600 mt-2">Siswa terdaftar di seluruh jalur</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100">
                        <p className="text-xs font-bold text-brand-700 uppercase mb-1">Tingkat Verifikasi</p>
                        <p className="text-4xl font-black text-cemara">{summary.verified_rate}%</p>
                        <p className="text-xs text-brand-600 mt-2">Persentase berkas valid</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-brand-50 border border-brand-100">
                        <p className="text-xs font-bold text-brand-700 uppercase mb-1">Saturasi Kuota</p>
                        <p className="text-4xl font-black text-cemara">{summary.quota_saturation}%</p>
                        <p className="text-xs text-brand-600 mt-2">Kapasitas terisi: {summary.total_filled.toLocaleString('id-ID')} / {summary.total_quota.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                {/* Path Breakdown */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-700 rounded-full" />
                        Distribusi Berdasarkan Jalur
                    </h3>
                    <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-bold text-ink-soft uppercase">
                                <tr>
                                    <th className="px-6 py-4">Nama Jalur</th>
                                    <th className="px-6 py-4 text-center">Jumlah Pendaftar</th>
                                    <th className="px-6 py-4 text-right">Persentase</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {path_breakdown.map((path, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 font-medium text-ink">{path.name}</td>
                                        <td className="px-6 py-4 text-center font-mono">{path.count.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right font-bold text-brand-700">{path.percentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Regional Breakdown */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-700 rounded-full" />
                        Analisis Saturasi Wilayah (Kab/Kota)
                    </h3>
                    <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-surface-container-low border-b border-outline-variant text-xs font-bold text-ink-soft uppercase">
                                <tr>
                                    <th className="px-6 py-4">Wilayah</th>
                                    <th className="px-6 py-4 text-center">Pendaftar</th>
                                    <th className="px-6 py-4 text-center">Kuota</th>
                                    <th className="px-6 py-4 text-right">Saturasi (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {regional_breakdown.map((reg, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4 font-medium text-ink">{reg.region}</td>
                                        <td className="px-6 py-4 text-center font-mono">{reg.pendaftar.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-center font-mono">{reg.quota.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-bold ${reg.saturation > 100 ? 'text-red-600' : 'text-brand-700'}`}>
                                                {reg.saturation}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Print Button */}
                <div className="mt-12 flex justify-center no-print">
                    <button
                        onClick={() => window.print()}
                        className="btn-primary px-8 py-3"
                    >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H7" />
                        </svg>
                        Cetak Laporan PDF
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
