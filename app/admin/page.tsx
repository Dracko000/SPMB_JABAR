'use client';

import { useState } from 'react';
import JalurManager from '@/components/admin/JalurManager';
import SekolahKuota from '@/components/admin/SekolahKuota';
import SeleksiPanel from '@/components/admin/SeleksiPanel';
import VerifikasiPanel from '@/components/admin/VerifikasiPanel';
import PengaduanPanel from '@/components/admin/PengaduanPanel';
import ResetButton from '@/components/admin/ResetButton';

const TAB: { id: string; label: string; Panel: () => React.ReactNode }[] = [
  { id: 'jalur', label: 'Jalur', Panel: JalurManager },
  { id: 'kuota', label: 'Kuota Sekolah', Panel: SekolahKuota },
  { id: 'seleksi', label: 'Seleksi', Panel: SeleksiPanel },
  { id: 'verifikasi', label: 'Verifikasi', Panel: VerifikasiPanel },
  { id: 'pengaduan', label: 'Pengaduan', Panel: PengaduanPanel },
  { id: 'reset', label: 'Reset', Panel: ResetButton },
];

/** Panel admin: semua pengaturan pada satu halaman, berpindah lewat tab. */
export default function AdminPage() {
  const [aktif, setAktif] = useState('jalur');
  const ActivePanel = TAB.find((t) => t.id === aktif)?.Panel ?? TAB[0].Panel;

  return (
    <div className="py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gov-800">Panel Admin</h1>
        <p className="mt-1 text-sm text-gov-700">
          Kelola jalur, kuota sekolah, jalankan seleksi, verifikasi dokumen, dan pengaduan.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAktif(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              t.id === aktif
                ? 'bg-gov-600 text-white'
                : 'bg-white text-gov-700 shadow hover:bg-gov-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="rounded-xl border border-gray-200 bg-gov-50/50 p-4 md:p-6">
        <ActivePanel />
      </div>

      <p className="mt-6 text-center text-xs text-gov-700">
        Panel admin prototipe SPMB Jabar. Data tersimpan di memori peramban dan hilang saat halaman
        dimuat ulang.
      </p>
    </div>
  );
}