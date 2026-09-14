'use client';

import { useState } from 'react';
import { useApp } from '@/store/context';
import DashboardKpi from '@/components/DashboardKpi';
import { formatAngka } from '@/lib/format';
import type { Peserta, Sekolah } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  proses: 'Proses',
  setuju: 'Setuju',
  tolak: 'Ditolak',
  minta_perbaikan: 'Perlu Perbaikan',
};

const STATUS_TONE: Record<string, string> = {
  proses: 'bg-gov-50 text-gov-700',
  setuju: 'bg-gov-green-600/15 text-gov-green-700',
  tolak: 'bg-red-600/10 text-red-700',
  minta_perbaikan: 'bg-amber-400/40 text-amber-900',
};

const PAPAN_BUTTON: Record<string, string> = {
  proses: 'bg-gov-600 text-white hover:bg-gov-700',
  setuju: 'bg-gov-green-600 text-white hover:bg-gov-green-700',
  tolak: 'bg-red-600 text-white hover:bg-red-700',
  minta_perbaikan: 'bg-amber-500 text-white hover:bg-amber-600',
};

/**
 * Dashboard Sekolah — kelola verifikasi dokumen pendaftar sekolah yang dipilih.
 * Aksi tombol memanggil `verifikasiDokumen(nisn, npsn, keputusan, catatan)` dan
 * status baris langsung diperbarui dari store.
 */
export default function DashboardSekolahPage() {
  const { state, verifikasiDokumen } = useApp();
  const [npsn, setNpsn] = useState<string>(state.sekolah[0]?.npsn ?? '');

  const { peserta, sekolah, jalur, pendaftaran } = state;

  // Jika sekolah list berubah (reset dsb.), tarik kembali ke awal.
  const npsnValid = sekolah.some((s) => s.npsn === npsn);
  const npsnAktif = npsnValid ? npsn : (sekolah[0]?.npsn ?? '');
  const aktif = sekolah.find((s) => s.npsn === npsnAktif) ?? null;

  const daftarBaris = (aktif?.pendaftar ?? [])
    .map((nisn): { nisn: string; peserta?: Peserta } => {
      const p = peserta.find((x) => x.nisn === nisn);
      return { nisn, peserta: p };
    })
    .sort((a, b) => a.nisn.localeCompare(b.nisn));

  const setujuCount = (aktif?.pendaftar ?? []).filter(
    (n) => pendaftaran[n]?.status === 'setuju'
  ).length;

  const keputusan = (nisn: string, kep: 'setuju' | 'tolak' | 'minta_perbaikan') => {
    verifikasiDokumen(nisn, aktif!.npsn, kep, defaultCatatan(kep));
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gov-800">Dashboard Sekolah</h1>
      <label className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gov-700">
        Sekolah:
        <select
          value={npsnAktif}
          onChange={(e) => setNpsn(e.target.value)}
          className="max-w-full rounded-lg border border-gov-600/40 bg-white px-3 py-1.5 font-medium text-gov-800 focus:border-gov-600 focus:outline-none"
        >
          {sekolah.map((s) => (
            <option key={s.npsn} value={s.npsn}>
              {s.nama} ({s.kabkota})
            </option>
          ))}
        </select>
      </label>

      {!aktif ? (
        <EmptyState />
      ) : (
        <>
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardKpi label="Pendaftar" value={aktif.pendaftar.length} />
            <DashboardKpi
              label="Sisa Kuota"
              value={formatAngka(sisaKuota(aktif))}
              formatValue={false}
            />
            <DashboardKpi label="Disetujui" value={setujuCount} />
            <DashboardKpi label="Wilayah" value={aktif.kabkota} formatValue={false} />
          </section>

          <section className="mt-6 rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-bold text-gov-800">Daftar Pendaftar — {aktif.nama}</h2>

            {daftarBaris.length === 0 ? (
              <p className="mt-4 text-sm text-gov-700">
                Belum ada pendaftar pada sekolah ini. Calon peserta dapat mendaftar melalui menu{' '}
                <a href="/daftar" className="font-semibold text-gov-600 underline">Daftar</a>.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gov-600/20 text-left text-xs uppercase tracking-wide text-gov-700">
                      <th className="py-2 pr-3 font-semibold">Nama</th>
                      <th className="py-2 pr-3 font-semibold">NISN</th>
                      <th className="py-2 pr-3 font-semibold">Jalur</th>
                      <th className="py-2 pr-3 font-semibold">Status Dokumen</th>
                      <th className="py-2 pr-3 font-semibold">Catatan</th>
                      <th className="py-2 pr-3 text-right font-semibold">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarBaris.map(({ nisn, peserta: p }) => {
                      const dfid = pendaftaran[nisn];
                      const jalurRow = dfid
                        ? jalur.find((j) => j.id === dfid.jalurId)
                        : null;
                      const status = dfid?.status ?? 'proses';
                      return (
                        <tr key={nisn} className="border-b border-gov-50 align-top">
                          <td className="py-2 pr-3 font-medium text-gov-900">{p?.nama ?? '—'}</td>
                          <td className="py-2 pr-3 font-mono text-xs text-gov-700">{nisn}</td>
                          <td className="py-2 pr-3 text-gov-700">{jalurRow?.nama ?? '—'}</td>
                          <td className="py-2 pr-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                STATUS_TONE[status] ?? STATUS_TONE.proses
                              }`}
                            >
                              {STATUS_LABEL[status] ?? status}
                            </span>
                          </td>
                          <td className="max-w-[180px] py-2 pr-3 text-xs text-gov-700">
                            {dfid?.catatan || <span aria-hidden>—</span>}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex justify-end gap-1.5">
                              {([
                                ['setuju', 'Setuju'],
                                ['tolak', 'Tolak'],
                                ['minta_perbaikan', 'Perbaiki'],
                              ] as const).map(([kep, label]) => (
                                <button
                                  key={kep}
                                  type="button"
                                  onClick={() => keputusan(nisn, kep)}
                                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                    status === kep
                                      ? PAPAN_BUTTON[kep]
                                      : 'border border-gov-600/40 bg-white text-gov-800 hover:bg-gov-50'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-6 rounded-xl bg-white p-6 text-center shadow">
      <p className="text-gov-700">Belum ada data sekolah. Coba periksa kembali nanti.</p>
    </section>
  );
}

function sisaKuota(skl: Sekolah): number {
  return (['domisili', 'afirmasi', 'prestasi', 'mutasi'] as const).reduce(
    (t, j) => t + Math.max(0, sisaJalur(skl, j)),
    0
  );
}

function sisaJalur(skl: Sekolah, jalurId: keyof Sekolah['kuota']): number {
  return Math.max(0, skl.kuota[jalurId] ?? 0);
}

/** Catatan verifikasi otomatis sesuai keputusan; prototipe tanpa form catatan bebas. */
function defaultCatatan(kep: 'setuju' | 'tolak' | 'minta_perbaikan'): string {
  switch (kep) {
    case 'setuju':
      return 'Dokumen lengkap dan sesuai — diverifikasi oleh sekolah.';
    case 'tolak':
      return 'Dokumen dinyatakan tidak valid oleh sekolah.';
    case 'minta_perbaikan':
      return 'Dokumen perlu diperbaiki — mohon unggah ulang.';
  }
}