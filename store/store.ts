import type { Jalur, Peserta, Sekolah } from '../types';
import { PESERTA } from '../mock/peserta';
import { SEKOLAH } from '../mock/sekolah';
import { JALUR_LIST } from '../mock/jalur';

/**
 * Status verifikasi dokumen pendaftaran peserta.
 */
export type StatusPendaftaran = 'proses' | 'setuju' | 'tolak' | 'minta_perbaikan';

/**
 * Kategori pengaduan sesuai spesifikasi SPMB.
 */
export type KategoriPengaduan =
  | 'Data tidak sesuai'
  | 'NISN tidak ditemukan'
  | 'Masalah pendaftaran'
  | 'Masalah sekolah'
  | 'Dokumen'
  | 'Seleksi'
  | 'Sistem'
  | 'Pengaduan lainnya';

export interface Pengaduan {
  id: string;
  nomorTiket: string;
  kategori: KategoriPengaduan;
  deskripsi: string;
  nisn?: string;
  status: string;
  tanggal: string;
}

export interface Pendaftaran {
  sekolahNpsn: string;
  jalurId: Jalur['id'];
  dokumen: Record<string, { file?: string; status?: string }>;
  status: StatusPendaftaran;
  tanggal: string;
  catatan?: string;
}

export interface AppState {
  peserta: Peserta[];
  sekolah: Sekolah[];
  jalur: Jalur[];
  pengaduan: Pengaduan[];
  hasilSeleksi: Record<string, 'diterima' | 'tidak_diterima'>;
  /** NISN -> data pendaftaran terkini peserta. */
  pendaftaran: Record<string, Pendaftaran>;
}

export const clampMin0 = (n: number) => Math.max(0, n);

export const deepClone = <T,>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));

// Induk data seeding: klon dalam dari mock, tempat runtime mutable.
const seed = (): AppState => ({
  peserta: deepClone(PESERTA),
  sekolah: deepClone(SEKOLAH),
  jalur: deepClone(JALUR_LIST),
  pengaduan: [],
  hasilSeleksi: {},
  pendaftaran: {},
});

let state: AppState = seed();

export const getStore = (): AppState => state;

export const resetStore = (): AppState => {
  state = seed();
  return state;
};

export const setJalurAktif = (id: Jalur['id'], aktif: boolean): AppState => {
  const next = deepClone(state);
  const jalur = next.jalur.find((j) => j.id === id);
  if (jalur) jalur.aktif = aktif;
  state = next;
  return state;
};

export const setKuota = (npsn: string, jalurId: Jalur['id'], delta: number): AppState => {
  const next = deepClone(state);
  const sekolah = next.sekolah.find((s) => s.npsn === npsn);
  if (sekolah && sekolah.kuota[jalurId] !== undefined) {
    sekolah.kuota[jalurId] = clampMin0(sekolah.kuota[jalurId] + delta);
  }
  state = next;
  return state;
};

export const daftarkan = (
  nisn: string,
  sekolahNpsn: string,
  jalurId: Jalur['id'],
  dokumen: Record<string, { file?: string; status?: string }>
): AppState => {
  const next = deepClone(state);
  const sekolah = next.sekolah.find((s) => s.npsn === sekolahNpsn);
  if (!sekolah) return state;
  if (!sekolah.pendaftar.includes(nisn)) sekolah.pendaftar.push(nisn);
  if (sekolah.kuota[jalurId] !== undefined) {
    sekolah.kuota[jalurId] = clampMin0(sekolah.kuota[jalurId] - 1);
  }
  next.pendaftaran[nisn] = {
    sekolahNpsn,
    jalurId,
    dokumen,
    status: 'proses',
    tanggal: new Date().toISOString(),
  };
  state = next;
  return state;
};

export const verifikasiDokumen = (
  nisn: string,
  sekolahNpsn: string,
  keputusan: 'setuju' | 'tolak' | 'minta_perbaikan',
  catatan: string
): AppState => {
  const next = deepClone(state);
  const pendaftaran = next.pendaftaran[nisn];
  if (pendaftaran && pendaftaran.sekolahNpsn === sekolahNpsn) {
    pendaftaran.status = keputusan;
    pendaftaran.catatan = catatan;
  }
  state = next;
  return state;
};

export const setSeleksi = (nisn: string, hasil: 'diterima' | 'tidak_diterima'): AppState => {
  const next = deepClone(state);
  next.hasilSeleksi[nisn] = hasil;
  state = next;
  return state;
};

export const tambahPengaduan = (
  data: Omit<Pengaduan, 'id' | 'nomorTiket' | 'tanggal'>
): AppState => {
  const next = deepClone(state);
  const no = next.pengaduan.length + 1;
  next.pengaduan = [
    ...next.pengaduan,
    {
      ...data,
      id: String(no),
      nomorTiket: `TKT-${String(no).padStart(4, '0')}`,
      tanggal: new Date().toISOString(),
    },
  ];
  state = next;
  return state;
};

export const setPengaduanStatus = (id: string, status: string): AppState => {
  const next = deepClone(state);
  const p = next.pengaduan.find((x) => x.id === id);
  if (p) p.status = status;
  state = next;
  return state;
};

export const reset = (): AppState => resetStore();