'use client';

import { cekKuota } from '@/lib/validasi';
import { formatAngka, formatTanggal, maskNIK } from '@/lib/format';
import type { Jalur, Peserta, Sekolah } from '@/types';

interface RingkasanPendaftaranProps {
  peserta: Peserta;
  jalur: Jalur | null;
  sekolah: Sekolah | null;
  dokumen: Record<string, { file?: string; status?: string }>;
  onSubmit: () => void;
}

/** Langkah 4: ringkasan semua pilihan; tombol kirim → `daftarkan`. */
export default function RingkasanPendaftaran({
  peserta,
  jalur,
  sekolah,
  dokumen,
  onSubmit,
}: RingkasanPendaftaranProps) {
  if (!jalur || !sekolah) return null;
  const kuota = cekKuota(sekolah, jalur.id);

  return (
    <div className="mt-4 space-y-5">
      <section className="rounded-lg border border-gov-600/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gov-700">Data Peserta</h3>
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <Ringkasan label="Nama">{peserta.nama}</Ringkasan>
          <Ringkasan label="NISN">
            <span className="font-mono">{peserta.nisn}</span>
          </Ringkasan>
          <Ringkasan label="NIK">
            <span className="font-mono">{maskNIK(peserta.nik)}</span>
          </Ringkasan>
          <Ringkasan label="Tanggal Lahir">{formatTanggal(peserta.tanggalLahir)}</Ringkasan>
          <Ringkasan label="Jenis Kelamin">{peserta.jenisKelamin}</Ringkasan>
          <Ringkasan label="Sekolah Asal">{peserta.sekolahAsal.nama}</Ringkasan>
          <Ringkasan label="Kab/Kota">
            {peserta.alamat.kabkota} — Kec. {peserta.alamat.kecamatan}
          </Ringkasan>
        </dl>
      </section>

      <section className="rounded-lg border border-gov-600/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gov-700">Pilihan</h3>
        <dl className="mt-2 grid grid-cols-1 gap-y-1 text-sm">
          <Ringkasan label="Jalur">{jalur.nama}</Ringkasan>
          <Ringkasan label="Sekolah Tujuan">{sekolah.nama}</Ringkasan>
          <Ringkasan label="Sisa Kuota">
            {formatAngka(kuota.sisa)}{' '}
            {kuota.penuh && <span className="text-red-600">(kuota habis)</span>}
          </Ringkasan>
        </dl>
      </section>

      <section className="rounded-lg border border-gov-600/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gov-700">
          Dokumen Persyaratan ({Object.keys(dokumen).filter((k) => dokumen[k]?.file).length} berkas)
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-gov-900">
          {Object.entries(dokumen)
            .filter(([, v]) => v?.file)
            .map(([slot, v]) => (
              <li key={slot}>
                {slot} —{' '}
                <span className="font-mono text-xs">{v?.file}</span>
                {v?.status ? ` (${v.status})` : ''}
              </li>
            ))}
          {Object.keys(dokumen).length === 0 && <li>Belum ada dokumen.</li>}
        </ul>
      </section>

      <p className="rounded-lg bg-gov-50 p-3 text-xs text-gov-700">
        Dengan menekan tombol Kirim, Anda menyatakan data yang diisi benar dan dokumen yang
        dilampirkan sesuai dengan persyaratan jalur pendaftaran.
      </p>
    </div>
  );
}

function Ringkasan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gov-700">{label}</dt>
      <dd className="text-right text-gov-900">{children}</dd>
    </div>
  );
}