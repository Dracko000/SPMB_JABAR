'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/store/context';
import DashboardKpi from '@/components/DashboardKpi';
import { formatAngka } from '@/lib/format';
import { KABUPATEN_KOTA } from '@/types';
import type { Sekolah } from '@/types';

const sisaKuotaJalur = (skl: Sekolah, jalurId: string): number =>
  Math.max(0, skl.kuota[jalurId as keyof Sekolah['kuota']] ?? 0);

const totalKuotaSekolah = (skl: Sekolah): number =>
  sisaKuotaJalur(skl, 'domisili') + sisaKuotaJalur(skl, 'afirmasi') +
  sisaKuotaJalur(skl, 'prestasi') + sisaKuotaJalur(skl, 'mutasi');

const totalKuotaKab = (daftar: Sekolah[]): number =>
  daftar.reduce((t, s) => t + totalKuotaSekolah(s), 0);

/**
 * Dashboard Kabupaten/Kota — pilih kabupaten/kota, lihat KPI wilayah itu,
 * lalu rincian kuota dan jumlah pendaftar tiap sekolah di dalamnya.
 */
export default function DashboardKabupatenPage() {
  const { state } = useApp();
  // Inisialisasi malas: tidak set state saat render. Nilai tak dikenal dinormalisasi
  // ke wilayah pertama secara turunan (`kabkotaAktif`) tanpa menulis ulang state.
  const [kabkota, setKabkota] = useState<string>(KABUPATEN_KOTA[0]);
  const kabkotaAktif = KABUPATEN_KOTA.includes(kabkota) ? kabkota : KABUPATEN_KOTA[0];

  const { sekolah, pendaftaran } = state;
  const sekolahDiKab = useMemo(
    () => sekolah.filter((s) => s.kabkota === kabkotaAktif),
    [sekolah, kabkotaAktif]
  );

  const jumlahPendaftarKab = useMemo(() => {
    const npsnSet = new Set(sekolahDiKab.map((s) => s.npsn));
    return Object.keys(pendaftaran).filter((nisn) =>
      npsnSet.has(pendaftaran[nisn]?.sekolahNpsn ?? '')
    ).length;
  }, [sekolahDiKab, pendaftaran]);

  const kuotaKab = useMemo(() => totalKuotaKab(sekolahDiKab), [sekolahDiKab]);

  const verifikasiKab = useMemo(() => {
    const npsnSet = new Set(sekolahDiKab.map((s) => s.npsn));
    let jumlah = 0;
    let setuju = 0;
    for (const nisn of Object.keys(pendaftaran)) {
      if (npsnSet.has(pendaftaran[nisn]?.sekolahNpsn ?? '')) {
        jumlah += 1;
        if (pendaftaran[nisn]?.status === 'setuju') setuju += 1;
      }
    }
    return jumlah === 0 ? 0 : Math.round((setuju / jumlah) * 100);
  }, [sekolahDiKab, pendaftaran]);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gov-800">Dashboard Kabupaten/Kota</h1>
      <label className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gov-700">
        Kabupaten/Kota:
        <select
          value={kabkotaAktif}
          onChange={(e) => setKabkota(e.target.value)}
          className="rounded-lg border border-gov-600/40 bg-white px-3 py-1.5 font-medium text-gov-800 focus:border-gov-600 focus:outline-none"
        >
          {KABUPATEN_KOTA.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </label>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardKpi label="Sekolah" value={sekolahDiKab.length} />
        <DashboardKpi label="Total Kuota" value={kuotaKab} />
        <DashboardKpi label="Pendaftar" value={jumlahPendaftarKab} />
        <DashboardKpi label="% Verifikasi Setuju" value={`${verifikasiKab}%`} formatValue={false} />
        <DashboardKpi label="Wilayah" value={kabkotaAktif} formatValue={false} />
      </section>

      <section className="mt-6 rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-bold text-gov-800">Sekolah di {kabkotaAktif}</h2>
        {sekolahDiKab.length === 0 ? (
          <p className="mt-4 text-sm text-gov-700">
            Tidak ada sekolah pada wilayah ini. Belum tersedia data sekolah untuk {kabkotaAktif}.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b border-gov-600/20 text-left text-xs uppercase tracking-wide text-gov-700">
                  <th className="py-2 pr-3 font-semibold">Sekolah</th>
                  <th className="py-2 pr-3 font-semibold">NPSN</th>
                  <th className="py-2 pr-3 text-center font-semibold">Domisili</th>
                  <th className="py-2 pr-3 text-center font-semibold">Afirmasi</th>
                  <th className="py-2 pr-3 text-center font-semibold">Prestasi</th>
                  <th className="py-2 pr-3 text-center font-semibold">Mutasi</th>
                  <th className="py-2 pr-3 text-center font-semibold">Kuota</th>
                  <th className="py-2 pr-3 text-right font-semibold">Pendaftar</th>
                </tr>
              </thead>
              <tbody>
                {sekolahDiKab.map((s) => {
                  const pendaftar = s.pendaftar.length;
                  return (
                    <tr key={s.npsn} className="border-b border-gov-50">
                      <td className="py-2 pr-3 font-medium text-gov-900">{s.nama}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-gov-700">{s.npsn}</td>
                      {(['domisili', 'afirmasi', 'prestasi', 'mutasi'] as const).map((j) => (
                        <td key={j} className="py-2 pr-3 text-center font-mono text-gov-700">
                          {formatAngka(sisaKuotaJalur(s, j))}
                        </td>
                      ))}
                      <td className="py-2 pr-3 text-center font-mono font-semibold text-gov-800">
                        {formatAngka(totalKuotaSekolah(s))}
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold text-gov-900">
                        {formatAngka(pendaftar)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gov-600/30 font-semibold text-gov-900">
                  <td className="py-2 pr-3" colSpan={2}>Total</td>
                  {(['domisili', 'afirmasi', 'prestasi', 'mutasi'] as const).map((j) => (
                    <td key={j} className="py-2 pr-3 text-center font-mono">
                      {formatAngka(sekolahDiKab.reduce((t, s) => t + sisaKuotaJalur(s, j), 0))}
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-center font-mono">{formatAngka(kuotaKab)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{formatAngka(jumlahPendaftarKab)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <p className="mt-3 text-xs text-gov-700">
        Kolom jalur (Domisili, Afirmasi, Prestasi, Mutasi) menampilkan <em>sisa kuota</em>{' '}
        tiap jalur. Pendaftar = jumlah NISN yang terdaftar pada sekolah itu.
      </p>
    </div>
  );
}