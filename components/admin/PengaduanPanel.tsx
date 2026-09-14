'use client';

import { useApp } from '@/store/context';
import { formatTanggal } from '@/lib/format';

const STATUS_PENGADUAN = ['Baru', 'Diproses', 'Selesai', 'Ditolak'];

/** Panel admin: daftar pengaduan + penggeser status per tiket. */
export default function PengaduanPanel() {
  const { state, setPengaduanStatus } = useApp();

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Pengaduan Masuk</h2>
      <p className="mt-1 text-sm text-gov-700">Kelola status lanjutan tiap tiket pengaduan.</p>

      {state.pengaduan.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
          Belum ada pengaduan masuk.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {state.pengaduan.map((t) => (
          <li key={t.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-bold text-gov-900">{t.nomorTiket}</p>
                <p className="mt-0.5 text-xs text-gov-700">
                  {t.kategori} · Diterima {formatTanggal(t.tanggal.slice(0, 10))}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gov-700">
                Status
                <select
                  value={t.status}
                  onChange={(e) => setPengaduanStatus(t.id, e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gov-900 outline-none focus:border-gov-600"
                >
                  {STATUS_PENGADUAN.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!STATUS_PENGADUAN.includes(t.status) && (
                    <option value={t.status}>{t.status}</option>
                  )}
                </select>
              </label>
            </div>
            <p className="mt-2 text-sm text-gov-800">{t.deskripsi}</p>
            <p className="mt-1 text-xs text-gov-700">
              NISN terkait: <span className="font-mono">{t.nisn ?? '—'}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}