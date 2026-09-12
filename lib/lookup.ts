import type { Peserta } from '../types';

/** Cari peserta berdasarkan NISN. Mengembalikan undefined bila tidak ditemukan. */
export const lookupPeserta = (nisn: string, pesertaList: Peserta[]): Peserta | undefined =>
  pesertaList.find((p) => p.nisn === nisn);

/** Periksa NISN: `ok: true` + peserta bila dikenal, `ok: false` bila tidak. */
export const verifikasiNisn = (
  nisn: string,
  pesertaList: Peserta[]
): { ok: boolean; peserta?: Peserta } => {
  const peserta = lookupPeserta(nisn, pesertaList);
  return peserta ? { ok: true, peserta } : { ok: false };
};