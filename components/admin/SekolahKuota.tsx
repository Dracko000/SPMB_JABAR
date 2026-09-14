'use client';

import { useApp } from '@/store/context';
import { formatAngka } from '@/lib/format';
import type { Sekolah } from '@/types';

/** Panel admin: kuota per jalur per sekolah, disesuaikan dengan tombol − / +. */
export default function SekolahKuota() {
  const { state, setKuota } = useApp();

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Kuota Sekolah per Jalur</h2>
      <p className="mt-1 text-sm text-gov-700">
        Sesuaikan daya tampung tiap jalur. Kuota tidak dapat turun di bawah nol.
      </p>

      {state.sekolah.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
          Belum ada data sekolah.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {state.sekolah.map((s: Sekolah) => (
          <div
            key={s.npsn}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-gov-900">{s.nama}</h3>
              <span className="font-mono text-xs text-gov-700">NPSN {s.npsn}</span>
            </div>
            <p className="mt-0.5 text-xs text-gov-700">{s.kabkota}</p>

            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {state.jalur.map((j) => {
                const kuota = s.kuota[j.id];
                if (kuota === undefined) return null;
                return (
                  <div key={j.id} className="rounded-lg bg-gov-50 p-3">
                    <p className="text-xs font-semibold text-gov-700">{j.nama}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        aria-label={`Kurangi kuota ${j.nama} ${s.nama}`}
                        disabled={kuota <= 0}
                        onClick={() => setKuota(s.npsn, j.id, -1)}
                        className="h-8 w-8 rounded-lg bg-gov-600 text-lg font-bold text-white transition enabled:hover:bg-gov-700 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="text-lg font-bold tabular-nums text-gov-900">
                        {formatAngka(kuota)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Tambah kuota ${j.nama} ${s.nama}`}
                        onClick={() => setKuota(s.npsn, j.id, 1)}
                        className="h-8 w-8 rounded-lg bg-gov-600 text-lg font-bold text-white transition hover:bg-gov-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}