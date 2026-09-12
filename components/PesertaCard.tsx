'use client';

import { useState, type FormEvent } from 'react';
import type { Peserta } from '@/types';
import { maskNIK } from '@/lib/format';

interface PesertaCardProps {
  peserta: Peserta;
  onAjukanPerbaikan: (deskripsi: string) => string;
}

const STATUS_BADGE: Record<Peserta['dataStatus'], string> = {
  Terverifikasi: 'bg-gov-green-600 text-white',
  'Belum Terverifikasi': 'bg-gray-300 text-gray-800',
  'Perlu Perbaikan': 'bg-amber-400 text-amber-950',
  'Tidak Ditemukan': 'bg-red-600 text-white',
  'Tidak Sesuai': 'bg-red-600 text-white',
};

/** Kartu data peserta setelah NISN ditemukan. */
export default function PesertaCard({ peserta, onAjukanPerbaikan }: PesertaCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<string | null>(null);

  const g = peserta.orangTua;
  const kontakOrangTua = g.namaWali
    ? `${g.namaWali} (${g.hubungan ?? 'Wali'})${g.kontak ? ` — ${g.kontak}` : ''}`
    : [g.namaAyah, g.namaIbu].filter(Boolean).join(' & ') + (g.kontak ? ` — ${g.kontak}` : '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const d = deskripsi.trim();
    if (!d) {
      setError('Deskripsi masalah wajib diisi.');
      return;
    }
    setHasil(onAjukanPerbaikan(d));
  };

  const handleReset = () => {
    setFormOpen(false);
    setDeskripsi('');
    setError(null);
    setHasil(null);
  };

  return (
    <article className="rounded-xl bg-white p-6 shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gov-800">{peserta.nama}</h2>
          <p className="text-sm text-gov-700">NISN {peserta.nisn}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[peserta.dataStatus]}`}>
          {peserta.dataStatus}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row label="NIK">
          <span className="font-mono text-gov-900">{maskNIK(peserta.nik)}</span>
        </Row>
        <Row label="Nama Dokumen">
          {peserta.namaDokumen}
          {peserta.namaDokumen !== peserta.nama && (
            <span className="text-gov-700"> ({peserta.nama})</span>
          )}
        </Row>
        <Row label="Tempat Lahir">{peserta.tempatLahir}</Row>
        <Row label="Tanggal Lahir">{peserta.tanggalLahir}</Row>
        <Row label="Jenis Kelamin">{peserta.jenisKelamin}</Row>
        <Row label="Agama">{peserta.agama}</Row>
        <Row label="Sekolah Asal">{peserta.sekolahAsal.nama}</Row>
      </dl>

      <h3 className="mt-5 text-sm font-semibold text-gov-800">Alamat</h3>
      <p className="mt-1 text-sm text-gov-900">
        {peserta.alamat.jalan}, {peserta.alamat.desa}, Kec. {peserta.alamat.kecamatan},{' '}
        {peserta.alamat.kabkota}, {peserta.alamat.provinsi} — RT {peserta.alamat.rt}/RW{' '}
        {peserta.alamat.rw}, Kode Pos {peserta.alamat.kodePos}
      </p>

      <h3 className="mt-4 text-sm font-semibold text-gov-800">Orang Tua / Wali</h3>
      <p className="mt-1 text-sm text-gov-900">
        {kontakOrangTua}
        <span className="text-gov-700">
          {' '}
          — Ayah {maskNIK(g.nikAyah)}, Ibu {maskNIK(g.nikIbu)}
        </span>
      </p>

      {hasil ? (
        <div className="mt-5 rounded-lg bg-gov-green-600/10 p-4 text-sm text-gov-900">
          <p className="font-semibold text-gov-green-700">
            Pengaduan terkirim. Nomor tiket: {hasil}
          </p>
          <p>Tim pengaduan akan menindaklanjuti data Anda.</p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 text-xs font-medium text-gov-700 underline"
          >
            Ajukan perbaikan lain
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/daftar?nisn=${peserta.nisn}`}
            className="rounded-lg bg-gov-green-600 px-4 py-2 font-semibold text-white transition hover:bg-gov-green-700"
          >
            DATA SUDAH SESUAI
          </a>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-lg border border-gov-600 px-4 py-2 font-semibold text-gov-800 transition hover:bg-gov-50"
          >
            AJUKAN PERBAIKAN
          </button>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg bg-gov-50 p-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gov-900">
            Deskripsi masalah
            <textarea
              value={deskripsi}
              onChange={(e) => {
                setDeskripsi(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder="Contoh: Nama ibu tidak sesuai dengan akta kelahiran."
              className="rounded-lg border border-gov-600 px-3 py-2 text-gov-900 outline-none focus:ring-2 focus:ring-gov-600"
            />
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-gov-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-700"
            >
              Kirim pengaduan
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-gov-600 px-4 py-2 text-sm font-medium text-gov-800 transition hover:bg-gov-50"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gov-700">{label}</dt>
      <dd className="text-gov-900">{children}</dd>
    </div>
  );
}