import { redirect } from 'next/navigation';
import Wizard from '@/components/Wizard';

/**
 * Halaman pendaftaran multi-langkah.
 * Membaca `nisn` dari query, memvalidasi format (13 digit), lalu menyerahkan
 * logika wizard ke komponen klien `Wizard` (data peserta ada di store klien).
 */
export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ nisn?: string | string[] }>;
}) {
  const { nisn } = await searchParams;
  const nilai = typeof nisn === 'string' ? nisn : undefined;
  if (!nilai || !/^\d{13}$/.test(nilai)) redirect('/cek-nisn');
  return <Wizard nisn={nilai} />;
}