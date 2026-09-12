import { describe, expect, it } from 'vitest';
import { PESERTA } from '../mock/peserta';
import { lookupPeserta, verifikasiNisn } from './lookup';

describe('lookupPeserta', () => {
  it('mengembalikan peserta saat NISN ditemukan', () => {
    const peserta = lookupPeserta(PESERTA[0].nisn, PESERTA);
    expect(peserta).toBeDefined();
    expect(peserta?.nama).toBe(PESERTA[0].nama);
  });

  it('mengembalikan undefined saat NISN tidak ditemukan', () => {
    expect(lookupPeserta('0012999999999', PESERTA)).toBeUndefined();
  });
});

describe('verifikasiNisn', () => {
  it('ok true beserta peserta untuk NISN valid', () => {
    const hasil = verifikasiNisn(PESERTA[0].nisn, PESERTA);
    expect(hasil.ok).toBe(true);
    expect(hasil.peserta?.nisn).toBe(PESERTA[0].nisn);
  });

  it('ok false tanpa peserta untuk NISN tidak dikenal', () => {
    const hasil = verifikasiNisn('0000000000000', PESERTA);
    expect(hasil.ok).toBe(false);
    expect(hasil.peserta).toBeUndefined();
  });
});