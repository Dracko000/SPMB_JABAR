'use client';

import type { Jalur } from '@/types';

interface DokumenUploadProps {
  jalur: Jalur | null;
  dokumen: Record<string, { file?: string; status?: string }>;
  onTambah: (dokumen: Record<string, { file?: string; status?: string }>) => void;
}

/**
 * Dokumen wajib tiap jalur. Mengambil dari `jalur.persyaratan` (tidak berawalan
 * "Warga"/"Berdomisili"/"Usia" = dokumen), dengan tambahan nama dokumen dari
 * data peserta (KK/Akta kelahiran) yang wajib di semua jalur.
 */
const tanpaAwalan = ['Berdomisili', 'Usia', 'Warga', 'Prestasi akademik'];

const dokumenWajib = (jalur: Jalur): string[] => {
  const dariJalur = jalur.persyaratan.filter(
    (p) => !tanpaAwalan.some((awal) => p.startsWith(awal))
  );
  const unik = [...new Set(['Bukti identitas (KK atau akta kelahiran)', ...dariJalur])];
  return unik;
};

/** Langkah 3: unggah dokumen persyaratan jalur. Input file hanya simulasi. */
export default function DokumenUpload({ jalur, dokumen, onTambah }: DokumenUploadProps) {
  if (!jalur) return null;
  const daftar = dokumenWajib(jalur);
  const terisi = daftar.filter((d) => dokumen[d]?.file);

  const setBerkas = (slot: string, file: string) => {
    onTambah({ ...dokumen, [slot]: { file, status: 'menunggu' } });
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-gov-700">
        Unggah dokumen wajib untuk jalur <span className="font-semibold">{jalur.nama}</span>.
        Pada prototipe, berkas hanya dicatat namanya — tidak benar-benar dikirim.
      </p>

      <ul className="mt-4 space-y-3">
        {daftar.map((slot) => {
          const d = dokumen[slot];
          return (
            <li
              key={slot}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gov-600/30 bg-gov-50 p-3"
            >
              <span className="text-sm font-medium text-gov-900">{slot}</span>
              <span className="flex items-center gap-2">
                {d?.file && (
                  <span className="rounded-full bg-gov-green-600/15 px-2 py-0.5 text-xs font-semibold text-gov-green-700">
                    {d.file} · {d.status ?? 'menunggu'}
                  </span>
                )}
                <label className="cursor-pointer rounded-lg bg-gov-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gov-700">
                  {d?.file ? 'Ganti berkas' : 'Pilih berkas'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setBerkas(slot, f.name);
                    }}
                  />
                </label>
              </span>
            </li>
          );
        })}
      </ul>

      {daftar.length > 0 && (
        <p
          className={`mt-4 text-sm ${
            terisi.length === daftar.length ? 'text-gov-green-700' : 'text-gov-700'
          }`}
        >
          {terisi.length === daftar.length
            ? 'Semua dokumen wajib sudah dilampirkan.'
            : `${terisi.length} dari ${daftar.length} dokumen wajib terisi.`}
        </p>
      )}
    </div>
  );
}