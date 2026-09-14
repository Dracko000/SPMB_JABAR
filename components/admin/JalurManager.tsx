'use client';

import { useApp } from '@/store/context';

/**
 * Panel admin: daftar semua jalur pendaftaran dengan sakelar aktif/nonaktif.
 * Toggle menulis langsung ke store via `setJalurAktif`.
 */
export default function JalurManager() {
  const { state, setJalurAktif } = useApp();

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Kelola Jalur Pendaftaran</h2>
      <p className="mt-1 text-sm text-gov-700">
        Buka atau tutup jalur pendaftaran. Jalur nonaktif tidak muncul di wizard pendaftaran.
      </p>

      {state.jalur.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
          Belum ada jalur pendaftaran.
        </p>
      )}

      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.jalur.map((j) => (
          <li key={j.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gov-900">{j.nama}</h3>
                <p className="mt-1 text-sm text-gov-700">{j.deskripsi}</p>
                <p className="mt-2 text-xs font-semibold text-gov-700">Bobot seleksi {j.bobot}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={j.aktif}
                aria-label={`Aktifkan ${j.nama}`}
                onClick={() => setJalurAktif(j.id, !j.aktif)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  j.aktif ? 'bg-gov-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    j.aktif ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                j.aktif ? 'bg-gov-green-600/15 text-gov-green-700' : 'bg-red-600/10 text-red-700'
              }`}
            >
              {j.aktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}