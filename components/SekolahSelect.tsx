'use client';

import { cekKuota } from '@/lib/validasi';
import { formatAngka } from '@/lib/format';
import type { Jalur, Sekolah } from '@/types';

interface SekolahSelectProps {
  sekolah: Sekolah[];
  jalur: Jalur | null;
  nisn: string;
  terpilih: string | null;
  onPilih: (sekolah: Sekolah) => void;
}

/**
 * Jarak domisili: placeholder deterministik (km) dari hash NISN.
 * Peserta tidak punya koordinat domisili di model data, jadi dipakai nilai
 * turunan tetap per NISN agar terlihat realistis tapi stabil antar render.
 * ponytail: ganti dengan haversine(koordinat domisili, koordinat sekolah)
 * saat model peserta memiliki field koordinat domisili.
 */
export const jarakDomisiliKm = (nisn: string): number => {
  let h = 0;
  for (let i = 0; i < nisn.length; i++) h = (h * 31 + nisn.charCodeAt(i)) >>> 0;
  return 1 + (h % 45); // 1–45 km
};

/** Langkah 2: pilih sekolah tujuan; kartu penuh dinonaktifkan. */
export default function SekolahSelect({ sekolah, jalur, nisn, terpilih, onPilih }: SekolahSelectProps) {
  if (!jalur) return null;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {sekolah.map((s) => {
        const { sisa, penuh } = cekKuota(s, jalur.id);
        const dipilih = terpilih === s.npsn;
        const jarak = jarakDomisiliKm(nisn);
        return (
          <button
            key={s.npsn}
            type="button"
            disabled={penuh}
            onClick={() => onPilih(s)}
            className={`rounded-xl border-2 p-4 text-left transition ${
              penuh
                ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
                : dipilih
                  ? 'border-gov-600 bg-gov-50'
                  : 'border-gray-200 bg-white hover:border-gov-600/50'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span>
                <span className="block font-semibold text-gov-900">{s.nama}</span>
                <span className="mt-0.5 block font-mono text-xs text-gov-700">NPSN {s.npsn}</span>
              </span>
              <span className="rounded-full bg-gov-600/10 px-2 py-0.5 text-xs font-semibold text-gov-700">
                {s.kabkota}
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  penuh ? 'bg-red-600 text-white' : 'bg-gov-green-600/15 text-gov-green-700'
                }`}
              >
                {penuh ? 'Kuota habis' : `Sisa kuota ${formatAngka(sisa)}`}
              </span>
              <span className="rounded-full bg-gov-50 px-2 py-0.5 font-semibold text-gov-700">
                Jarak domisili {jarak} km
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}