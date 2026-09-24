import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';

export default function SelectionReport({ reportData, pathName, regionName }) {
    return (
        <div className="bg-white min-h-screen p-0 m-0 print:p-8">
            <Head title={`Laporan Seleksi - ${pathName}`} />

            {/* Print-only Header: Government Letterhead Style */}
            <div className="hidden print:block mb-8 border-b-4 border-black pb-4">
                <div className="flex items-center gap-4">
                    <div className="size-20 bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs text-center font-bold">
                        LOGO<br/>PROVINSI
                    </div>
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-black uppercase">Pemerintah Provinsi Jawa Barat</h1>
                        <h2 className="text-lg font-bold uppercase">Dinas Pendidikan</h2>
                        <p className="text-sm italic">Jl. Dr. Radjiman No. 6, Bandung, Jawa Barat</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto py-12 px-6">
                {/* Web-only view wrapper */}
                <div className="print:hidden mb-6 flex justify-between items-center">
                    <button
                        onClick={() => window.history.back()}
                        className="text-sm font-bold text-brand-700 hover:underline"
                    >
                        ← Kembali ke Dashboard
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn-primary px-6 py-2"
                    >
                        Cetak PDF / Print
                    </button>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-cemara uppercase mb-2">Laporan Hasil Seleksi</h1>
                    <p className="text-lg font-medium text-ink-soft">
                        Jalur: <span className="text-ink font-bold">{pathName}</span>
                        {regionName && ` | Wilayah: <span className="text-ink font-bold">${regionName}</span>`}
                    </p>
                    <p className="text-sm text-ink-faint mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 px-4 py-2 text-left font-bold">Rank</th>
                                <th className="border border-slate-300 px-4 py-2 text-left font-bold">Nama Siswa</th>
                                <th className="border border-slate-300 px-4 py-2 text-left font-bold">Sekolah Tujuan</th>
                                <th className="border border-slate-300 px-4 py-2 text-center font-bold">Skor Komposit</th>
                                <th className="border border-slate-300 px-4 py-2 text-center font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.data.map((row, i) => (
                                <tr key={i} className="even:bg-slate-50">
                                    <td className="border border-slate-300 px-4 py-2 text-center font-mono">
                                        {i + 1}
                                    </td>
                                    <td className="border border-slate-300 px-4 py-2 font-medium">{row.nama}</td>
                                    <td className="border border-slate-300 px-4 py-2">{row.sekolah}</td>
                                    <td className="border border-slate-300 px-4 py-2 text-center font-mono font-bold">{row.skor}</td>
                                    <td className="border border-slate-300 px-4 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            row.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-20 text-right">
                    <div>
                        <p className="text-sm text-ink-faint italic">Mengetahui,</p>
                        <p className="text-sm font-bold mb-20">Kepala Dinas Pendidikan</p>
                        <p className="text-sm font-black underline">NIP. 19XXXXXXXXXXXXXX</p>
                    </div>
                    <div>
                        <p className="text-sm text-ink-faint italic">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm font-bold mb-20">Panitia Seleksi SPMB JABAR</p>
                        <p className="text-sm font-black underline">Sistem Verifikasi Otomatis</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
