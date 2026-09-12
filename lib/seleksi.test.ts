import { describe, expect, it } from 'vitest';
import type { Sekolah } from '../types';
import { JALUR_LIST } from '../mock/jalur';
import { SEKOLAH } from '../mock/sekolah';
import { jalankanSeleksi } from './seleksi';
import type { PendaftarSeleksi } from './seleksi';

// bobot dari mock jalur: domisili 40 > afirmasi 30 > prestasi 20 > mutasi 10.
const JALUR = JALUR_LIST;

const denganKuota = (kuota: Sekolah['kuota']): Sekolah => ({ ...SEKOLAH[0], kuota });

describe('jalankanSeleksi', () => {
  it('mendahulukan calon jalur berbobot lebih tinggi walau nilainya lebih rendah', () => {
    const sekolah = denganKuota({ ...SEKOLAH[0].kuota, domisili: 1, prestasi: 0 });
    const pendaftar: PendaftarSeleksi[] = [
      { nisn: 'A', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 5, prestasi: 10, jarakKm: 5 },
      { nisn: 'B', sekolahNpsn: sekolah.npsn, jalurId: 'prestasi', nilai: 999, prestasi: 999, jarakKm: 1 },
    ];
    const hasil = jalankanSeleksi(pendaftar, [sekolah], JALUR);
    expect(hasil['A']).toBe('diterima');
    expect(hasil['B']).toBe('tidak_diterima');
  });

  it('menerima calon terbaik sampai kuota sekolah-jalur terisi; sisanya ditolak', () => {
    const sekolah = denganKuota({ ...SEKOLAH[0].kuota, domisili: 2, prestasi: 0, afirmasi: 0, mutasi: 0 });
    const pendaftar: PendaftarSeleksi[] = [
      { nisn: 'A', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 10 },
      { nisn: 'B', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 9 },
      { nisn: 'C', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 8 },
    ];
    const hasil = jalankanSeleksi(pendaftar, [sekolah], JALUR);
    expect(hasil['A']).toBe('diterima');
    expect(hasil['B']).toBe('diterima');
    expect(hasil['C']).toBe('tidak_diterima');
  });

  it('membandingkan nilai, lalu prestasi, lalu jarak terdekat dalam satu kuota', () => {
    const sekolah = denganKuota({ ...SEKOLAH[0].kuota, domisili: 1, prestasi: 0, afirmasi: 0, mutasi: 0 });
    const pendaftar: PendaftarSeleksi[] = [
      { nisn: 'A', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 10, prestasi: 10, jarakKm: 10 },
      { nisn: 'B', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 10, prestasi: 20, jarakKm: 10 },
      { nisn: 'C', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 10, prestasi: 20, jarakKm: 5 },
    ];
    const hasil = jalankanSeleksi(pendaftar, [sekolah], JALUR);
    expect(hasil['C']).toBe('diterima');
    expect(hasil['A']).toBe('tidak_diterima');
    expect(hasil['B']).toBe('tidak_diterima');
  });

  it('menolak calon di sekolah yang tidak ada dalam daftar', () => {
    const sekolah = denganKuota({ ...SEKOLAH[0].kuota });
    const pendaftar: PendaftarSeleksi[] = [
      { nisn: 'X', sekolahNpsn: '99999999', jalurId: 'domisili', nilai: 100 },
      { nisn: 'Y', sekolahNpsn: sekolah.npsn, jalurId: 'domisili', nilai: 50 },
    ];
    const hasil = jalankanSeleksi(pendaftar, [sekolah], JALUR);
    expect(hasil['X']).toBe('tidak_diterima');
    expect(hasil['Y']).toBe('diterima');
    // Semua pendaftar tercatat hasilnya.
    expect(Object.keys(hasil).sort()).toEqual(['X', 'Y']);
  });
});