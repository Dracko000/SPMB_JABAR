import { redirect } from 'next/navigation';
import HasilClient from './HasilClient';

/**
 * Halaman Hasil Seleksi SPMB Jabar.
 * Membaca `nisn` dari query, memvalidasi format (13 digit), lalu menyerahkan
 * tampilan status seleksi ke komponen klien (data peserta ada di store klien).
 */
export default async function HasilPage({
  searchParams,
}: {
  searchParams: Promise<{ nisn?: string | string[] }>;
}) {
  const { nisn } = await searchParams;
  const nilai = typeof nisn === 'string' ? nisn : undefined;
  if (!nilai || !/^\d{13}$/.test(nilai)) redirect('/cek-nisn');
  return <HasilClient nisn={nilai} />;
}