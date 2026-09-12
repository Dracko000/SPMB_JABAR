import { describe, expect, it } from 'vitest';
import { PESERTA } from '../mock/peserta';
import { formatAngka, formatTanggal, maskNIK } from './format';

describe('maskNIK', () => {
  it('menyembunyikan bagian tengah NIK 16 digit (mock)', () => {
    expect(maskNIK(PESERTA[0].nik)).toBe('3273******0001');
  });

  it('mengikuti format contoh spesifikasi', () => {
    expect(maskNIK('3215112312341234')).toBe('3215******1234');
  });

  it('NIK pendek dimask seluruhnya', () => {
    expect(maskNIK('123')).toBe('******');
  });
});

describe('formatAngka', () => {
  it('memisahkan ribuan dengan gaya id-ID', () => {
    expect(formatAngka(1234567)).toBe('1.234.567');
  });

  it('menangani nol', () => {
    expect(formatAngka(0)).toBe('0');
  });
});

describe('formatTanggal', () => {
  it('memformat tanggal ISO ke teks Indonesia', () => {
    expect(formatTanggal('2026-03-15')).toBe('15 Maret 2026');
  });
});