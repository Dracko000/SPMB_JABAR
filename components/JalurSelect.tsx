'use client';

import type { Jalur } from '@/types';

interface JalurSelectProps {
  daftar: Jalur[];
  terpilih: string | null;
  onPilih: (id: Jalur['id']) => void;
}

/** Langkah 1: pilih jalur pendaftaran dari jalur yang aktif. */
export default function JalurSelect({ daftar, terpilih, onPilih }: JalurSelectProps) {
  if (daftar.length === 0) {
    return (
      <p className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
        Belum ada jalur pendaftaran yang dibuka. Silakan datang kembali nanti.
      </p>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {daftar.map((j) => {
        const dipilih = terpilih === j.id;
        return (
          <label
            key={j.id}
            className={`cursor-pointer rounded-xl border-2 p-4 transition ${
              dipilih
                ? 'border-gov-600 bg-gov-50'
                : 'border-gray-200 bg-white hover:border-gov-600/50'
            }`}
          >
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="jalur"
                checked={dipilih}
                onChange={() => onPilih(j.id)}
                className="mt-1 h-4 w-4 accent-gov-600"
              />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gov-900">{j.nama}</span>
                  <span className="rounded-full bg-gov-600/10 px-2 py-0.5 text-xs font-semibold text-gov-700">
                    Bobot {j.bobot}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-gov-700">{j.deskripsi}</span>
                <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gov-700">
                  Persyaratan
                </span>
                <ul className="mt-1 list-inside list-disc text-sm text-gov-900">
                  {j.persyaratan.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}