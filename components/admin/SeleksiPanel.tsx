'use client';

import { useState } from 'react';
import { useApp } from '@/store/context';
import { jalankanSeleksi, type PendaftarSeleksi } from '@/lib/seleksi';
import { jarakDomisiliKm } from '@/components/SekolahSelect';
import { formatAngka } from '@/lib/format';

/** Nilai turunan deterministik (0–100) dari hash NISN — realistis dan stabil antar render. */
const nilaiDariNisn = (nisn: string): number => {
  let h = 0;
  for (let i = 0; i < nisn.length; i++) h = (h * 31 + nisn.charCodeAt(i)) >>> 0;
  return h % 101;
};

/** Prestasi turunan deterministik (0–100) dari hash NISN. */
const prestasiDariNisn = (nisn: string): number => {
  let h = 0;
  for (let i = 0; i < nisn.length; i++) h = (h * 33 + nisn.charCodeAt(i)) >>> 0;
  return h % 101;
};

interface RingkasanSeleksi {
  /** Jumlah pendaftar (status setuju) yang benar-benar dibawa ke mesin seleksi. */
  total: number;
  /** Jumlah keputusan yang ditulis ke store (`Object.keys(hasil).length`). */
  diproses: number;
  diterima: number;
}

/**
 * Panel admin: jalankan seleksi untuk semua pendaftaran berstatus `setuju`.
 * Bangun daftar pendaftar → `jalankanSeleksi` → tulis hasil via `setSeleksi`
 * (nilai/prestasi/jarak diturunkan deterministik dari NISN agar realistis).
 *
 * Ringkasan dihitung dari input nyata (`pendaftar.length`), bukan dari
 * `Object.keys(hasil)` — sehingga tidak pernah tampak "semua diputuskan"
 * padahal tidak ada yang diproses.
 */
export default function SeleksiPanel() {
  const { state, setSeleksi } = useApp();
  const [berjalan, setBerjalan] = useState(false);
  const [ringkasan, setRingkasan] = useState<RingkasanSeleksi | null>(null);

  const jumlahPendaftarSetuju = Object.values(state.pendaftaran).filter(
    (p) => p.status === 'setuju'
  ).length;

  const jalankan = () => {
    if (jumlahPendaftarSetuju === 0) return;
    setBerjalan(true);

    const pendaftar: PendaftarSeleksi[] = Object.entries(state.pendaftaran)
      .filter(([, p]) => p.status === 'setuju')
      .map(([nisn, p]) => ({
        nisn,
        sekolahNpsn: p.sekolahNpsn,
        jalurId: p.jalurId,
        nilai: nilaiDariNisn(nisn),
        prestasi: prestasiDariNisn(nisn),
        jarakKm: jarakDomisiliKm(nisn),
      }));

    const hasil = jalankanSeleksi(pendaftar, state.sekolah, state.jalur);

    let diterima = 0;
    for (const [nisn, keputusan] of Object.entries(hasil)) {
      if (keputusan === 'diterima') diterima++;
      setSeleksi(nisn, keputusan);
    }
    setRingkasan({
      total: pendaftar.length,
      diproses: Object.keys(hasil).length,
      diterima,
    });
    setBerjalan(false);
  };

  // Ringkasan lama basi bila store di-reset (hasilSeleksi dikosongkan) — jangan tampilkan.
  const ringkasanTampil =
    ringkasan && Object.keys(state.hasilSeleksi).length > 0 ? ringkasan : null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Jalankan Seleksi</h2>
      <p className="mt-1 text-sm text-gov-700">
        Seleksi diproses untuk semua pendaftaran berstatus <b>Setuju</b>, sesuai kuota sekolah per
        jalur. Hasil langsung muncul di halaman /hasil.
      </p>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow">
        <p className="text-sm text-gov-900">
          Pendaftar siap diseleksi (status Setuju):{' '}
          <span className="font-semibold">{formatAngka(jumlahPendaftarSetuju)}</span>{' '}
          <span className="text-gov-700">
            dari {formatAngka(Object.keys(state.pendaftaran).length)} pendaftaran tercatat
          </span>
        </p>
        <button
          type="button"
          disabled={jumlahPendaftarSetuju === 0 || berjalan}
          onClick={jalankan}
          className="mt-3 rounded-lg bg-gov-600 px-5 py-2 font-semibold text-white transition enabled:hover:bg-gov-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {berjalan ? 'Memproses…' : 'Jalankan Seleksi'}
        </button>
        {jumlahPendaftarSetuju === 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Belum ada pendaftaran berstatus Setuju untuk diseleksi. Verifikasi dahulu dokumen
            pendaftar di tab Verifikasi.
          </p>
        )}
      </div>

      {ringkasanTampil && (
        <div className="mt-4 grid max-w-sm grid-cols-3 gap-3">
          <div className="rounded-xl bg-gov-green-600/10 p-4 text-center">
            <p className="text-2xl font-bold text-gov-green-700">
              {formatAngka(ringkasanTampil.diterima)}
            </p>
            <p className="text-sm font-semibold text-gov-green-700">Diterima</p>
          </div>
          <div className="rounded-xl bg-red-600/10 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">
              {formatAngka(ringkasanTampil.total - ringkasanTampil.diterima)}
            </p>
            <p className="text-sm font-semibold text-red-700">Tidak Diterima</p>
          </div>
          <div className="rounded-xl bg-gov-50 p-4 text-center">
            <p className="text-2xl font-bold text-gov-700">
              {formatAngka(ringkasanTampil.total - ringkasanTampil.diproses)}
            </p>
            <p className="text-sm font-semibold text-gov-700">Belum Diproses</p>
          </div>
        </div>
      )}
    </section>
  );
}