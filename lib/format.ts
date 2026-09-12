/** Helper format tampilan: masking NIK, angka id-ID, tanggal Indonesia. */

/** Mask NIK: 4 digit awal + `******` + 4 digit akhir. Pendek (< 8 digit) → penuh mask. */
export const maskNIK = (nik: string): string => {
  const pendek = nik.length < 8;
  if (pendek) return '******';
  return nik.slice(0, 4) + '******' + nik.slice(-4);
};

/** Angka dengan pemisah ribuan gaya Indonesia (id-ID). */
export const formatAngka = (n: number): string => new Intl.NumberFormat('id-ID').format(n);

/** Tanggal ISO (`YYYY-MM-DD`) → teks Indonesia, mis. `15 Maret 2026`.
 * Parse jam lokal tengah malam agar tanggal tidak bergeser zona waktu. */
export const formatTanggal = (iso: string): string =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso + 'T00:00:00')
  );