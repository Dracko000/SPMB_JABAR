import { describe, expect, it } from 'vitest';
import type { Peserta } from '../types';
import { PESERTA } from '../mock/peserta';
import { SEKOLAH } from '../mock/sekolah';
import { JALUR_LIST } from '../mock/jalur';
import { cekKuota, validasiPersyaratan } from './validasi';

const jalurDomisili = JALUR_LIST.find((j) => j.id === 'domisili')!;

describe('validasiPersyaratan', () => {
  it('lulus untuk peserta lengkap (data asli) pada jalur domisili', () => {
    const peserta = PESERTA.find((p) => p.jalur === 'domisili')!;
    const hasil = validasiPersyaratan(peserta, jalurDomisili);
    expect(hasil.pass).toBe(true);
    expect(hasil.masalah).toEqual([]);
  });

  it('gagal dengan masalah bila bukti domisili (KK) tidak dilampirkan', () => {
    const tanpaKK: Peserta = { ...PESERTA[0], namaDokumen: 'Akta Kelahiran' };
    const hasil = validasiPersyaratan(tanpaKK, jalurDomisili);
    expect(hasil.pass).toBe(false);
    expect(hasil.masalah.length).toBeGreaterThan(0);
  });

  it('gagal dengan masalah bila domisili di luar Jawa Barat', () => {
    const luarJabar: Peserta = { ...PESERTA[0], alamat: { ...PESERTA[0].alamat, provinsi: 'DKI Jakarta' } };
    const hasil = validasiPersyaratan(luarJabar, jalurDomisili);
    expect(hasil.pass).toBe(false);
    expect(hasil.masalah.length).toBeGreaterThan(0);
  });
});

describe('cekKuota', () => {
  it('melaporkan sisa kuota dan tidak penuh selama masih ada kursi', () => {
    const hasil = cekKuota(SEKOLAH[0], 'domisili');
    expect(hasil.sisa).toBe(SEKOLAH[0].kuota.domisili);
    expect(hasil.penuh).toBe(false);
  });

  it('menandai penuh saat kuota jalur habis', () => {
    const sekolahPenuh = { ...SEKOLAH[0], kuota: { ...SEKOLAH[0].kuota, domisili: 0 } };
    const hasil = cekKuota(sekolahPenuh, 'domisili');
    expect(hasil.sisa).toBe(0);
    expect(hasil.penuh).toBe(true);
  });
});