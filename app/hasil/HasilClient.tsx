'use client';

import { useApp } from '@/store/context';
import { lookupPeserta } from '@/lib/lookup';
import type { Jalur, Sekolah } from '@/types';

/**
 * Tampilan hasil seleksi untuk satu NISN — di-render klien karena data
 * peserta, pendaftaran, dan hasil seleksi berada di store klien.
 */
export default function HasilClient({ nisn }: { nisn: string }) {
  const { state } = useApp();
  const peserta = lookupPeserta(nisn, state.peserta);
  const pendaftaran = state.pendaftaran[nisn];
  const hasilSeleksi = state.hasilSeleksi[nisn];

  const sekolah = pendaftaran
    ? (state.sekolah.find((s) => s.npsn === pendaftaran.sekolahNpsn) ?? null)
    : null;
  const jalur = pendaftaran
    ? (state.jalur.find((j) => j.id === pendaftaran.jalurId) ?? null)
    : null;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-gov-800">Hasil Seleksi</h1>
      <p className="mt-1 text-sm text-gov-700">
        NISN <span className="font-mono font-semibold">{nisn}</span>
        {peserta ? ` — ${peserta.nama}` : ''}
      </p>

      {hasilSeleksi ? (
        <KartuHasil hasil={hasilSeleksi} jalur={jalur} sekolah={sekolah} />
      ) : (
        <BelumAdaHasil jalur={jalur} sekolah={sekolah} />
      )}
    </div>
  );
}

/** Belum ada keputusan seleksi — beri pesan ramah + ringkasan pendaftaran bila ada. */
function BelumAdaHasil({
  jalur,
  sekolah,
}: {
  jalur: Jalur | null;
  sekolah: Sekolah | null;
}) {
  return (
    <section className="mt-6 rounded-xl bg-white p-6 shadow">
      <p className="text-lg font-semibold text-gov-800">
        Belum ada hasil seleksi. Hubungi sekolah.
      </p>
      <p className="mt-1 text-sm text-gov-700">
        Hasil akan diumumkan setelah proses seleksi selesai. Silakan pantau halaman ini secara
        berkala.
      </p>
      {jalur && sekolah && (
        <dl className="mt-4 grid max-w-sm grid-cols-1 gap-y-2 rounded-lg bg-gov-50 p-4 text-sm">
          <BarisRingkasan label="Jalur">{jalur.nama}</BarisRingkasan>
          <BarisRingkasan label="Sekolah Tujuan">{sekolah.nama}</BarisRingkasan>
        </dl>
      )}
    </section>
  );
}

/** Keputusan sudah keluar — badge DITERIMA/TIDAK DITERIMA + info pendaftaran. */
function KartuHasil({
  hasil,
  jalur,
  sekolah,
}: {
  hasil: 'diterima' | 'tidak_diterima';
  jalur: Jalur | null;
  sekolah: Sekolah | null;
}) {
  const diterima = hasil === 'diterima';

  return (
    <section
      className={`mt-6 rounded-xl p-6 shadow ${
        diterima ? 'bg-gov-green-600/10' : 'bg-red-600/10'
      }`}
    >
      <div
        className={`inline-flex items-center rounded-lg px-5 py-2 text-xl font-bold text-white ${
          diterima ? 'bg-gov-green-600' : 'bg-red-600'
        }`}
      >
        {diterima ? 'DITERIMA' : 'TIDAK DITERIMA'}
      </div>
      <p className="mt-3 text-sm text-gov-800">
        {diterima
          ? 'Selamat! Anda dinyatakan diterima pada seleksi SPMB Jabar. Silakan lakukan daftar ulang sesuai jadwal.'
          : 'Mohon maaf, Anda tidak diterima pada seleksi SPMB Jabar.'}
      </p>

      <dl className="mt-4 grid max-w-sm grid-cols-1 gap-y-2 rounded-lg bg-white p-4 text-sm">
        <BarisRingkasan label="Jalur">{jalur?.nama ?? '—'}</BarisRingkasan>
        <BarisRingkasan label="Sekolah Tujuan">{sekolah?.nama ?? '—'}</BarisRingkasan>
      </dl>

      {diterima && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gov-green-700">
            Daftar ulang: 15–19 Juli 2026 di sekolah tujuan.
          </p>
          <button
            type="button"
            onClick={() => alert('Fitur cetak bukti akan tersedia segera.')}
            className="rounded-lg bg-gov-600 px-5 py-2 font-semibold text-white transition hover:bg-gov-700"
          >
            Cetak Bukti
          </button>
        </div>
      )}
    </section>
  );
}

function BarisRingkasan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gov-700">{label}</dt>
      <dd className="text-right font-medium text-gov-900">{children}</dd>
    </div>
  );
}