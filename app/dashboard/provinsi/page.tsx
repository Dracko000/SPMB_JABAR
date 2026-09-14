'use client';

import { useApp } from '@/store/context';
import DashboardKpi from '@/components/DashboardKpi';
import PetaJabar from '@/components/PetaJabar';
import { formatTanggal } from '@/lib/format';
import { KABUPATEN_KOTA } from '@/types';
import type { Sekolah } from '@/types';

/** Bitmap simbol kecil untuk slot ikon KPI (tanpa dependency ikon eksternal). */
const Ikon = ({ children }: { children: string }) => (
  <span aria-hidden className="text-lg leading-none">{children}</span>
);

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

/**
 * Dashboard Provinsi — ringkasan seluruh peta pendaftaran Jawa Barat:
 * KPI agregat, peta sebaran pendaftar per kabupaten/kota, dan daftar pendaftaran terbaru.
 */
export default function DashboardProvinsiPage() {
  const { state } = useApp();
  const { peserta, sekolah, jalur, pendaftaran } = state;

  const daftarNISN = Object.keys(pendaftaran);
  const totalPendaftar = daftarNISN.length;
  const totalSekolah = sekolah.length;

  const totalKuota = sekolah.reduce((total, s) => {
    const kuotaSekolah = (s.kuota.domisili ?? 0) + (s.kuota.afirmasi ?? 0) +
      (s.kuota.prestasi ?? 0) + (s.kuota.mutasi ?? 0);
    return total + kuotaSekolah;
  }, 0);

  const verified = peserta.filter((p) => p.dataStatus === 'Terverifikasi').length;
  const pctTerverifikasi = peserta.length === 0 ? 0 : Math.round((verified / peserta.length) * 100);

  // Hari ini dalam WIB (UTC+7). Tanggal pendaftaran disimpan via
  // `new Date().toISOString()` (UTC), jadi pembanding keduanya dipatok ke WIB
  // agar konsisten dengan zona waktu sekolah/pendaftar.
  const hariIniWib = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const pendaftarHariIni = daftarNISN.filter((n) => {
    const t = pendaftaran[n]?.tanggal ?? '';
    return t.slice(0, 10) === hariIniWib;
  }).length;
  const hariIni = hariIniWib;

  const perKabkota: Record<string, number> = Object.fromEntries(
    KABUPATEN_KOTA.map((k) => [k, 0])
  );
  for (const n of daftarNISN) {
    const skl = sekolah.find((s) => s.npsn === pendaftaran[n]?.sekolahNpsn);
    if (skl && perKabkota[skl.kabkota] !== undefined) perKabkota[skl.kabkota] += 1;
  }

  const terbaru = daftarNISN
    .map((nisn, i) => ({ nisn, i }))
    .sort((a, b) => {
      const ta = pendaftaran[a.nisn]?.tanggal ?? '';
      const tb = pendaftaran[b.nisn]?.tanggal ?? '';
      return tb.localeCompare(ta) || b.i - a.i;
    })
    .slice(0, 8);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gov-800">Dashboard Provinsi</h1>
      <p className="mt-1 text-sm text-gov-700">
        Ringkasan pendaftaran SPMB Jawa Barat — <strong>{formatTanggal(hariIni)}</strong>
      </p>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardKpi label="Total Pendaftar" value={totalPendaftar} icon={<Ikon>👥</Ikon>}
          delta={totalPendaftar > 0 ? 'Tercatat di sistem' : 'Belum ada'} />
        <DashboardKpi label="Total Sekolah" value={totalSekolah} icon={<Ikon>🏫</Ikon>}
          delta={`${totalKuota} kursi kuota total`} />
        <DashboardKpi label="Total Kuota" value={totalKuota} icon={<Ikon>🎫</Ikon>}
          delta={totalKuota > 0 ? 'Seluruh jalur' : 'Belum ada'} />
        <DashboardKpi label="% Data Terverifikasi" value={`${pctTerverifikasi}%`} formatValue={false} icon={<Ikon>✅</Ikon>}
          delta={`${verified} dari ${peserta.length} peserta`} deltaTone={pctTerverifikasi >= 70 ? 'baik' : 'naik'} />
        <DashboardKpi label="Pendaftar Hari Ini" value={pendaftarHariIni} icon={<Ikon>📅</Ikon>}
          delta="Tanggal pendaftaran (WIB)" />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PetaJabar jumlahPendaftar={perKabkota} />

        <section className="rounded-xl bg-white p-4 shadow">
          <h2 className="text-lg font-bold text-gov-800">Pendaftaran Terbaru</h2>
          {terbaru.length === 0 ? (
            <p className="mt-4 text-sm text-gov-700">
              Belum ada pendaftaran masuk. Ajak calon peserta mengisi pendaftaran lewat menu{' '}
              <a href="/daftar" className="font-semibold text-gov-600 underline">Daftar</a>.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gov-600/20 text-left text-xs uppercase tracking-wide text-gov-700">
                    <th className="py-2 pr-3 font-semibold">Nama</th>
                    <th className="py-2 pr-3 font-semibold">NISN</th>
                    <th className="py-2 pr-3 font-semibold">Sekolah</th>
                    <th className="py-2 pr-3 font-semibold">Jalur</th>
                    <th className="py-2 pr-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {terbaru.map(({ nisn }) => {
                    const p = pendaftaran[nisn];
                    const pesertaRow = peserta.find((x) => x.nisn === nisn);
                    const skl = p ? sekolah.find((s) => s.npsn === p.sekolahNpsn) : null;
                    const jalurRow = p ? jalur.find((j) => j.id === p.jalurId) : null;
                    return (
                      <tr key={nisn} className="border-b border-gov-50">
                        <td className="py-2 pr-3 font-medium text-gov-900">{pesertaRow?.nama ?? '—'}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-gov-700">{nisn}</td>
                        <td className="py-2 pr-3 text-gov-700">{skl?.nama ?? '—'}</td>
                        <td className="py-2 pr-3 text-gov-700">{jalurRow?.nama ?? '—'}</td>
                        <td className="py-2 pr-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[p?.status ?? 'proses'] ?? STATUS_TONE.proses}`}>
                            {STATUS_LABEL[p?.status ?? 'proses'] ?? p?.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}