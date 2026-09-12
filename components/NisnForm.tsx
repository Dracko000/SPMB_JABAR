'use client';

import { useState, type FormEvent } from 'react';

interface NisnFormProps {
  validNisn: string[];
  nisn: string;
  onNisnChange: (nisn: string) => void;
  onPeriksa: () => void;
}

/** Form input NISN + tombol "Periksa", plus daftar NISN demo yang valid. */
export default function NisnForm({ validNisn, nisn, onNisnChange, onPeriksa }: NisnFormProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = nisn.trim();
    if (!v) {
      setError('NISN wajib diisi.');
      return;
    }
    if (!/^\d{13}$/.test(v)) {
      setError('NISN harus 13 digit angka.');
      return;
    }
    setError(null);
    onPeriksa();
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold text-gov-800">Cek Data NISN</h1>
      <p className="mt-1 text-sm text-gov-700">
        Masukkan NISN untuk memeriksa data calon peserta didik sebelum mendaftar.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gov-900">
          NISN
          <input
            value={nisn}
            onChange={(e) => {
              onNisnChange(e.target.value.replace(/\D/g, ''));
              setError(null);
            }}
            inputMode="numeric"
            maxLength={13}
            placeholder="0012321456789"
            className="w-56 rounded-lg border border-gov-600 px-3 py-2 text-gov-900 outline-none focus:ring-2 focus:ring-gov-600"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-gov-600 px-5 py-2 font-semibold text-white transition hover:bg-gov-700"
        >
          Periksa
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-5 rounded-lg bg-gov-50 p-4 text-sm text-gov-900">
        <p className="font-medium text-gov-800">Demo: NISN yang tersedia</p>
        <p className="mt-1">
          Contoh valid:{' '}
          <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-gov-800">
            {validNisn[0]}
          </code>
        </p>
        <p className="mt-2 text-xs text-gov-700">
          Klik NISN untuk mengisi otomatis. NISN lain 13 digit digunakan untuk menguji kasus
          &ldquo;tidak ditemukan&rdquo;.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {validNisn.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onNisnChange(n)}
              className="rounded border border-gov-600/40 bg-white px-2 py-1 font-mono text-xs text-gov-800 transition hover:border-gov-600 hover:bg-gov-50"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}