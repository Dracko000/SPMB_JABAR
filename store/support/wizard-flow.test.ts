import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore, daftarkan } from '../store';
import { dokumenLengkap, dokumenWajib } from '../../components/DokumenUpload';
import { SEKOLAH } from '../../mock/sekolah';

/**
 * Submit-path wizard (fix round 1): komponen memanggil
 * `daftarkan(nisn, sekolah.npsn, jalur.id, dokumen)` — store/context.tsx & store/store.ts.
 * Tes integrasi gate dokumen + kontrak store, karena tombol browser tak bisa diklik di CI.
 */
describe('gate dokumen & store.daftarkan (fix round 1)', () => {
  beforeEach(() => resetStore());

  const NISN = '0012321456789';

  it('dokumenLengkap hanya benar bila semua slot dokumen wajib jalur terisi', () => {
    const jalur = getStore().jalur.find((j) => j.id === 'domisili')!;
    const wajib = dokumenWajib(jalur);
    expect(wajib.length).toBeGreaterThan(1);
    const setengah = Object.fromEntries(
      wajib.slice(0, 1).map((d) => [d, { file: 'a.pdf', status: 'menunggu' }])
    );
    expect(dokumenLengkap(jalur, {})).toBe(false);
    expect(dokumenLengkap(jalur, setengah)).toBe(false);
    const lengkap = Object.fromEntries(
      wajib.map((d) => [d, { file: `${d}.pdf`, status: 'menunggu' }])
    );
    expect(dokumenLengkap(jalur, lengkap)).toBe(true);
  });

  it('store.daftarkan mencatat pendaftaran + menurunkan kuota, lalu idempoten', () => {
    const sebelum = getStore();
    const sekolah = sebelum.sekolah.find((s) => s.npsn === '20224567')!;
    const kuotaAwal = sekolah.kuota.domisili;

    const jalur = sebelum.jalur.find((j) => j.id === 'domisili')!;
    const dokumen = Object.fromEntries(
      dokumenWajib(jalur).map((d) => [d, { file: `${d}.pdf`, status: 'menunggu' }])
    );

    const s1 = daftarkan(NISN, sekolah.npsn, jalur.id, dokumen);
    expect(s1.pendaftaran[NISN]).toMatchObject({
      sekolahNpsn: sekolah.npsn,
      jalurId: 'domisili',
      status: 'proses',
    });
    expect(sekolah.pendaftar).not.toContain(NISN);
    expect(s1.sekolah.find((s) => s.npsn === sekolah.npsn)!.pendaftar).toEqual([NISN]);
    expect(s1.sekolah.find((s) => s.npsn === sekolah.npsn)!.kuota.domisili).toBe(kuotaAwal - 1);

    // Panggilan ulang NISN sama = idempoten: pendaftaran tetap, kuota tidak berkurang lagi.
    const s2 = daftarkan(NISN, sekolah.npsn, jalur.id, dokumen);
    const s3 = daftarkan(NISN, sekolah.npsn, jalur.id, dokumen);
    expect(s2.pendaftaran[NISN]).toBeDefined();
    expect(s3.sekolah.find((s) => s.npsn === sekolah.npsn)!.kuota.domisili).toBe(kuotaAwal - 1);
    expect(s3.sekolah.find((s) => s.npsn === sekolah.npsn)!.pendaftar.filter((n) => n === NISN)).toHaveLength(1);
  });

  it('store.daftarkan menerima dbRecord apa pun; penegak kelengkapan ada di Wizard/dokumenLengkap', () => {
    const sebelum = getStore();
    const npsn = sebelum.sekolah[0].npsn;
    const res = daftarkan(NISN, npsn, 'prestasi', {});
    expect(res.pendaftaran[NISN]).toBeDefined();
  });
});