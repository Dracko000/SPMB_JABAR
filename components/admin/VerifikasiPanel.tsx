'use client';

import { useApp } from '@/store/context';
import { lookupPeserta } from '@/lib/lookup';
import { formatTanggal } from '@/lib/format';

const LABEL_STATUS: Record<string, string> = {
  proses: 'Proses',
  setuju: 'Disetujui',
  tolak: 'Ditolak',
  minta_perbaikan: 'Minta Perbaikan',
};

/** Panel admin: daftar pendaftaran + keputusan verifikasi dokumen (setuju/tolak/minta perbaikan). */
export default function VerifikasiPanel() {
  const { state, verifikasiDokumen } = useApp();

  const daftar = Object.entries(state.pendaftaran);
  const namaSekolah = new Map(state.sekolah.map((s) => [s.npsn, s.nama]));
  const namaJalur = new Map(state.jalur.map((j) => [j.id, j.nama]));

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Verifikasi Dokumen Pendaftaran</h2>
      <p className="mt-1 text-sm text-gov-700">
        Periksa dan putuskan kelengkapan dokumen tiap pendaftar. Hanya status{' '}
        <b>Disetujui</b> yang diikutkan ke seleksi.
      </p>

      {daftar.length === 0 && (
        <p className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
          Belum ada pendaftaran untuk diverifikasi.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {daftar.map(([nisn, p]) => {
          const peserta = lookupPeserta(nisn, state.peserta);
          return (
            <li key={nisn} className="rounded-xl border border-gray-200 bg-white p-4 shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gov-900">
                    {peserta?.nama ?? 'Peserta tidak ditemukan'}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-gov-700">
                    NISN {nisn} · {namaSekolah.get(p.sekolahNpsn) ?? p.sekolahNpsn} ·{' '}
                    {namaJalur.get(p.jalurId) ?? p.jalurId}
                  </p>
                  <p className="mt-1 text-xs text-gov-700">
                    Didaftarkan {formatTanggal(p.tanggal.slice(0, 10))}
                  </p>
                  {p.catatan && (
                    <p className="mt-2 rounded-lg bg-gov-50 p-2 text-xs text-gov-800">
                      Catatan verifikasi: {p.catatan}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.status === 'setuju'
                      ? 'bg-gov-green-600/15 text-gov-green-700'
                      : p.status === 'tolak'
                        ? 'bg-red-600/10 text-red-700'
                        : p.status === 'minta_perbaikan'
                          ? 'bg-amber-400/60 text-amber-950'
                          : 'bg-gov-600/10 text-gov-700'
                  }`}
                >
                  {LABEL_STATUS[p.status] ?? p.status}
                </span>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-gov-700" htmlFor={`catatan-${nisn}`}>
                  Catatan (opsional)
                </label>
                <form
                  className="mt-1 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    id={`catatan-${nisn}`}
                    type="text"
                    placeholder="Contoh: KK tidak terbaca"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gov-900 outline-none focus:border-gov-600"
                  />
                  {(
                    [
                      ['setuju', 'Setuju'],
                      ['tolak', 'Tolak'],
                      ['minta_perbaikan', 'Minta Perbaikan'],
                    ] as const
                  ).map(([keputusan, label]) => (
                    <button
                      key={keputusan}
                      type="submit"
                      disabled={p.status === keputusan}
                      onClick={(e) => {
                        const form = e.currentTarget.form;
                        const catatan = form ? (form.elements.namedItem(`catatan-${nisn}`) as HTMLInputElement)?.value ?? '' : '';
                        e.preventDefault();
                        verifikasiDokumen(nisn, p.sekolahNpsn, keputusan, catatan);
                        if (form) (form.elements.namedItem(`catatan-${nisn}`) as HTMLInputElement).value = '';
                      }}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                        p.status === keputusan
                          ? 'bg-gov-50 text-gov-700'
                          : keputusan === 'setuju'
                            ? 'bg-gov-green-600 text-white hover:bg-gov-green-700'
                            : keputusan === 'tolak'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-amber-400/80 text-amber-950 hover:bg-amber-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}