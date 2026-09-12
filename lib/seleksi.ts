import type { Jalur, Sekolah } from '../types';

export interface PendaftarSeleksi {
  nisn: string;
  sekolahNpsn: string;
  jalurId: Jalur['id'];
  nilai?: number;
  prestasi?: number;
  jarakKm?: number;
}

/**
 * Jalankan seleksi penerimaan secara deterministik per sekolah per jalur.
 * Urutan prioritas: bobot jalur (turun) → nilai (turun) → prestasi (turun)
 * → jarak (naik) → NISN (stabil untuk hasil konsisten).
 * Terima sampai kuota jalur sekolah terisi; sisanya ditolak.
 */
export const jalankanSeleksi = (
  pendaftar: PendaftarSeleksi[],
  sekolahList: Sekolah[],
  jalurList: Jalur[]
): Record<string, 'diterima' | 'tidak_diterima'> => {
  const bobot = new Map(jalurList.map((j) => [j.id, j.bobot]));
  const sekolahMap = new Map(sekolahList.map((s) => [s.npsn, s]));
  // Kursi tersisa per pasangan sekolah-jalur.
  const sisa = new Map<string, number>();
  const hasil: Record<string, 'diterima' | 'tidak_diterima'> = {};

  const urut = [...pendaftar].sort((a, b) => {
    const bobotA = bobot.get(a.jalurId) ?? 0;
    const bobotB = bobot.get(b.jalurId) ?? 0;
    if (bobotA !== bobotB) return bobotB - bobotA;
    const nilaiA = a.nilai ?? 0;
    const nilaiB = b.nilai ?? 0;
    if (nilaiA !== nilaiB) return nilaiB - nilaiA;
    const prestasiA = a.prestasi ?? 0;
    const prestasiB = b.prestasi ?? 0;
    if (prestasiA !== prestasiB) return prestasiB - prestasiA;
    const jarakA = a.jarakKm ?? Infinity;
    const jarakB = b.jarakKm ?? Infinity;
    if (jarakA !== jarakB) return jarakA - jarakB;
    return a.nisn.localeCompare(b.nisn);
  });

  for (const p of urut) {
    const sekolah = sekolahMap.get(p.sekolahNpsn);
    if (!sekolah) {
      hasil[p.nisn] = 'tidak_diterima';
      continue;
    }
    const key = `${p.sekolahNpsn}:${p.jalurId}`;
    if (!sisa.has(key)) sisa.set(key, Math.max(0, sekolah.kuota[p.jalurId] ?? 0));
    const tersisa = sisa.get(key)!;
    if (tersisa > 0) {
      sisa.set(key, tersisa - 1);
      hasil[p.nisn] = 'diterima';
    } else {
      hasil[p.nisn] = 'tidak_diterima';
    }
  }

  return hasil;
};