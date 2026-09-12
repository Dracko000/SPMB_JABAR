// Types + shared constants untuk prototipe SPMB Jabar.
// Sumber kebenaran untuk semua bentuk data yang dipakai halaman/store nanti.

export type RoleDemo = 'masyarakat' | 'sekolah' | 'kabkota' | 'provinsi';

export type DataStatus =
  | 'Terverifikasi'
  | 'Belum Terverifikasi'
  | 'Perlu Perbaikan'
  | 'Tidak Ditemukan'
  | 'Tidak Sesuai';

export type JalurId = 'domisili' | 'afirmasi' | 'prestasi' | 'mutasi';

export interface Alamat {
  provinsi: string;
  kabkota: string;
  kecamatan: string;
  desa: string;
  jalan: string;
  rt: string;
  rw: string;
  kodePos: string;
}

export interface OrangTua {
  namaAyah: string;
  nikAyah: string;
  namaIbu: string;
  nikIbu: string;
  namaWali?: string;
  hubungan?: string;
  kontak?: string;
}

export interface SekolahAsal {
  npsn: string;
  nama: string;
}

export interface Jalur {
  id: JalurId;
  nama: string;
  aktif: boolean;
  deskripsi: string;
  persyaratan: string[];
  bobot: number;
}

export interface Peserta {
  nisn: string;
  nik: string;
  nama: string;
  namaDokumen: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  agama: string;
  statusPeserta: string;
  alamat: Alamat;
  orangTua: OrangTua;
  sekolahAsal: SekolahAsal;
  dataStatus: DataStatus;
  jalur?: JalurId;
}

export interface Koordinat {
  lat: number;
  lng: number;
}

export interface Kuota {
  domisili: number;
  afirmasi: number;
  prestasi: number;
  mutasi: number;
}

export interface Sekolah {
  npsn: string;
  nama: string;
  kabkota: string;
  kecamatan: string;
  alamat: string;
  koordinat: Koordinat;
  kuota: Kuota;
  pendaftar: string[]; // NISN pendaftar
}

// 10 kabupaten/kota Jawa Barat yang dipakai konsisten di seluruh mock data.
export const KABUPATEN_KOTA: string[] = [
  'Kota Bandung',
  'Kabupaten Bandung',
  'Kabupaten Bandung Barat',
  'Kabupaten Garut',
  'Kabupaten Karawang',
  'Kota Bekasi',
  'Kabupaten Bekasi',
  'Kabupaten Cianjur',
  'Kabupaten Sumedang',
  'Kabupaten Purwakarta',
];