import type { Jalur, Peserta, Sekolah } from '../types';

export interface HasilValidasi {
  pass: boolean;
  masalah: string[];
}

/**
 * Validasi kelengkapan persyaratan jalur terhadap data peserta.
 * Pemeriksaan berbasis `jalur.id`: hanya yang ekspresibel dari model data
 * (provinsi, namaDokumen) ikut diverifikasi; afirmasi/mutasi tidak punya
 * field pendukung di tipe Peserta sehingga lulus tanpa masalah.
 */
export const validasiPersyaratan = (peserta: Peserta, jalur: Jalur): HasilValidasi => {
  const masalah: string[] = [];
  const dokumen = peserta.namaDokumen.toLowerCase();

  if (jalur.id === 'domisili') {
    if (peserta.alamat.provinsi.toLowerCase() !== 'jawa barat') {
      masalah.push('Domisili harus di Jawa Barat');
    }
    const punyaBuktiDomisili = ['kartu keluarga', 'kk'].some((k) => dokumen.includes(k));
    if (!punyaBuktiDomisili) {
      masalah.push('Bukti domisili (KK atau surat keterangan domisili) belum dilampirkan');
    }
  }

  if (jalur.id === 'prestasi') {
    const punyaSertifikat = ['sertifikat', 'piagam'].some((k) => dokumen.includes(k));
    if (!punyaSertifikat) {
      masalah.push('Sertifikat/piagam prestasi belum dilampirkan');
    }
  }

  return { pass: masalah.length === 0, masalah };
};

/** Sisa kuota jalur sebuah sekolah + flag penuh. Kuota store sudah berupa sisa (terdecrement). */
export const cekKuota = (sekolah: Sekolah, jalurId: Jalur['id']): { sisa: number; penuh: boolean } => {
  const sisa = Math.max(0, sekolah.kuota[jalurId] ?? 0);
  return { sisa, penuh: sisa <= 0 };
};