'use client';

import { useState } from 'react';
import { useApp } from '@/store/context';
import { lookupPeserta } from '@/lib/lookup';
import { validasiPersyaratan } from '@/lib/validasi';
import { formatTanggal } from '@/lib/format';
import type { Jalur, Sekolah } from '@/types';
import JalurSelect from './JalurSelect';
import SekolahSelect from './SekolahSelect';
import DokumenUpload, { dokumenLengkap } from './DokumenUpload';
import RingkasanPendaftaran from './RingkasanPendaftaran';

type Langkah = 'jalur' | 'sekolah' | 'dokumen' | 'ringkasan';

const URUTAN: Langkah[] = ['jalur', 'sekolah', 'dokumen', 'ringkasan'];

const JUDUL: Record<Langkah, string> = {
  jalur: 'Pilih Jalur',
  sekolah: 'Pilih Sekolah',
  dokumen: 'Unggah Dokumen',
  ringkasan: 'Ringkasan',
};

const NOMOR: Record<Langkah, string> = {
  jalur: 'Langkah 1 dari 4',
  sekolah: 'Langkah 2 dari 4',
  dokumen: 'Langkah 3 dari 4',
  ringkasan: 'Langkah 4 dari 4',
};

/**
 * Wizard pendaftaran SPMB — Jalur → Sekolah → Dokumen → Ringkasan → Submit.
 * Semua hook diletakkan paling atas agar urutan panggilan stabil.
 */
export default function Wizard({ nisn }: { nisn: string }) {
  const { state, daftarkan } = useApp();
  const peserta = lookupPeserta(nisn, state.peserta);

  const [langkah, setLangkah] = useState<Langkah>('jalur');
  const [jalurId, setJalurId] = useState<string | null>(null);
  const [sekolah, setSekolah] = useState<Sekolah | null>(null);
  const [dokumen, setDokumen] = useState<Record<string, { file?: string; status?: string }>>({});
  const [selesai, setSelesai] = useState(false);

  const setJalur = (id: string | null) => {
    if (id !== jalurId) {
      setJalurId(id);
      setSekolah(null); // sekolah bergantung jalur; pastikan tidak bocor antar jalur
    }
    setDokumen({}); // dokumen wajib beda antar jalur — usir berkas lama
  };

  const jalurTerpilih = jalurId
    ? (state.jalur.find((j) => j.id === jalurId) ?? null)
    : null;
  const aktif = state.jalur.filter((j) => j.aktif);

  if (!peserta) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-center text-lg text-gov-700">
          NISN <span className="font-mono font-semibold">{nisn}</span> tidak ditemukan di data SPMB
          Jabar.{' '}
          <a href="/cek-nisn" className="font-semibold text-gov-600 underline">
            Periksa kembali NISN Anda
          </a>
        </p>
      </div>
    );
  }

  const validasi = jalurTerpilih ? validasiPersyaratan(peserta, jalurTerpilih) : null;

  // Layar sukses setelah kirim (sebelum guard "sudah terdaftar" mengambil alih).
  if (selesai) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <div className="rounded-xl bg-white p-8 shadow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gov-green-600 text-2xl text-white">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gov-800">Pendaftaran Terkirim</h1>
          <p className="mt-2 text-gov-700">
            Terima kasih, <span className="font-semibold">{peserta.nama}</span>. Pendaftaran Anda
            telah kami terima dan sedang dalam proses verifikasi.
          </p>
          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-1 gap-y-2 rounded-lg bg-gov-50 p-4 text-sm">
            <InfoPendaftaran label="ID Pendaftaran">
              <span className="font-mono font-semibold text-gov-900">
                {idPendaftaran(nisn)}
              </span>
            </InfoPendaftaran>
            <InfoPendaftaran label="NISN">
              <span className="font-mono">{nisn}</span>
            </InfoPendaftaran>
            <InfoPendaftaran label="Jalur">{jalurTerpilih?.nama}</InfoPendaftaran>
            <InfoPendaftaran label="Sekolah">{sekolah?.nama}</InfoPendaftaran>
            <InfoPendaftaran label="Tanggal">
              {formatTanggal(new Date().toISOString().slice(0, 10))}
            </InfoPendaftaran>
          </dl>
          <a
            href={`/hasil?nisn=${nisn}`}
            className="mt-6 inline-block rounded-lg bg-gov-600 px-5 py-2 font-semibold text-white transition hover:bg-gov-700"
          >
            Lihat Status di Halaman Hasil
          </a>
        </div>
      </div>
    );
  }

  // Hakim: pendaftaran aktif sudah tercatat di store.
  if (state.pendaftaran[nisn]) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-center text-lg text-gov-700">
          Anda sudah terdaftar.{' '}
          <a href={`/hasil?nisn=${nisn}`} className="font-semibold text-gov-600 underline">
            Lihat status pendaftaran
          </a>
        </p>
      </div>
    );
  }

  const idx = URUTAN.indexOf(langkah);
  const langkahSelesai = (l: Langkah): boolean => {
    if (l === 'jalur') return !!jalurId;
    if (l === 'sekolah') return !!sekolah;
    if (l === 'dokumen' && jalurTerpilih) return dokumenLengkap(jalurTerpilih, dokumen);
    return false;
  };

  const terima = () => {
    if (!jalurTerpilih || !sekolah || !dokumenLengkap(jalurTerpilih, dokumen)) return;
    daftarkan(nisn, sekolah.npsn, jalurTerpilih.id, dokumen);
    setSelesai(true);
  };

  return (
    <div className="mx-auto max-w-4xl py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gov-800">Pendaftaran SPMB Jabar</h1>
        <p className="mt-1 text-sm text-gov-700">
          NISN <span className="font-mono font-semibold">{peserta.nisn}</span> — {peserta.nama}
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {URUTAN.map((l, i) => {
          const tercapai = i < idx || langkahSelesai(URUTAN[i - 1]);
          return (
            <button
              key={l}
              type="button"
              disabled={i > idx || !tercapai}
              onClick={() => setLangkah(l)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                l === langkah
                  ? 'bg-gov-600 text-white'
                  : i < idx
                    ? 'bg-gov-green-600/15 text-gov-green-700'
                    : 'bg-gov-50 text-gov-700'
              }`}
            >
              {i + 1}. {JUDUL[l]}
            </button>
          );
        })}
      </nav>

      <section className="rounded-xl bg-white p-6 shadow">
        <p className="text-xs font-semibold uppercase tracking-wide text-gov-700">{NOMOR[langkah]}</p>

        {langkah === 'jalur' && (
          <JalurSelect daftar={aktif} terpilih={jalurId} onPilih={setJalur} />
        )}
        {langkah === 'sekolah' && (
          <SekolahSelect
            sekolah={state.sekolah}
            jalur={jalurTerpilih}
            nisn={peserta.nisn}
            terpilih={sekolah?.npsn ?? null}
            onPilih={setSekolah}
          />
        )}
        {langkah === 'dokumen' && (
          <DokumenUpload jalur={jalurTerpilih} dokumen={dokumen} onTambah={setDokumen} />
        )}
        {langkah === 'ringkasan' && (
          <RingkasanPendaftaran
            peserta={peserta}
            jalur={jalurTerpilih}
            sekolah={sekolah}
            dokumen={dokumen}
            onSubmit={terima}
          />
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setLangkah(URUTAN[idx - 1])}
            className="rounded-lg border border-gov-600 px-4 py-2 font-semibold text-gov-800 transition enabled:hover:bg-gov-50 disabled:opacity-40"
          >
            Kembali
          </button>
          {langkah !== 'ringkasan' && (
            <button
              type="button"
              disabled={!langkahSelesai(langkah)}
              onClick={() => setLangkah(URUTAN[idx + 1])}
              className="rounded-lg bg-gov-600 px-5 py-2 font-semibold text-white transition enabled:hover:bg-gov-700 disabled:opacity-40"
            >
              Lanjut
            </button>
          )}
        </div>
      </section>

      {validasi && !validasi.pass && (
        <aside className="mt-4 rounded-lg bg-amber-400/60 p-4 text-sm text-amber-950">
          <p className="font-semibold">Perhatian persyaratan jalur {jalurTerpilih?.nama}:</p>
          <ul className="mt-1 list-inside list-disc">
            {validasi.masalah.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </aside>
      )}

      <p className="mt-6 text-center text-xs text-gov-700">
        Pendaftaran ini masih prototipe — dokumen tidak benar-benar diunggah, hanya dicatat nama
        filenya.
      </p>
    </div>
  );
}

/** ID pendaftaran deterministik: SPMB-<nisn>-<yyyymmdd>. */
function idPendaftaran(nisn: string): string {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
    today.getDate()
  ).padStart(2, '0')}`;
  return `SPMB-${nisn}-${ymd}`;
}

function InfoPendaftaran({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-gov-700">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}