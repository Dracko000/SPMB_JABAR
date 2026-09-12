import type { Jalur } from '../types';

export const JALUR_LIST: Jalur[] = [
  {
    id: 'domisili',
    nama: 'Jalur Domisili',
    aktif: true,
    deskripsi:
      'Penerimaan calon peserta didik berdasarkan kedekatan domisili dengan sekolah tujuan.',
    persyaratan: [
      'Warga Negara Indonesia (WNI)',
      'Berdomisili di Jawa Barat minimal 1 (satu) tahun',
      'Melampirkan bukti domisili (KK atau surat keterangan domisili)',
      'Usia sesuai ketentuan jenjang pendidikan',
    ],
    bobot: 40,
  },
  {
    id: 'afirmasi',
    nama: 'Jalur Afirmasi',
    aktif: true,
    deskripsi:
      'Kuota bagi calon peserta didik dari keluarga ekonomi tidak mampu dan penyandang disabilitas.',
    persyaratan: [
      'Menyertakan bukti kepesertaan program penanganan keluarga tidak mampu (KIP/PKH/KIS)',
      'Berdomisili di Jawa Barat',
      'Melampirkan surat keterangan dari pihak berwenang bagi penyandang disabilitas',
    ],
    bobot: 30,
  },
  {
    id: 'prestasi',
    nama: 'Jalur Prestasi',
    aktif: true,
    deskripsi:
      'Penerimaan berdasarkan prestasi akademik dan/atau non-akademik yang diraih calon peserta didik.',
    persyaratan: [
      'Melampirkan sertifikat/piagam prestasi yang masih berlaku',
      'Prestasi akademik dari rapor atau prestasi non-akademik tingkat kabupaten/kota ke atas',
      'Berdomisili di Jawa Barat',
    ],
    bobot: 20,
  },
  {
    id: 'mutasi',
    nama: 'Jalur Perpindahan Tugas Orang Tua',
    aktif: false,
    deskripsi:
      'Penerimaan bagi calon peserta didik yang mengikuti perpindahan tugas orang tua/wali.',
    persyaratan: [
      'Menyertakan surat penugasan perpindahan tempat tinggal oleh instansi orang tua/wali',
      'Melampirkan surat keterangan pindah domisili',
    ],
    bobot: 10,
  },
];