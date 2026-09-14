'use client';

import { formatAngka } from '@/lib/format';
import type { ReactNode } from 'react';

interface DashboardKpiProps {
  label: string;
  value: string | number;
  /** Delta opsional, mis. "naik 12% dari minggu lalu" — hanya teks, chip berwarna bila diberi `deltaTone`. */
  delta?: string;
  deltaTone?: 'baik' | 'naik' | 'turun';
  /** Slot ikon/element kecil di pojok kanan atas kartu. */
  icon?: ReactNode;
  /** Nilai format otomatis bila number (pemisah ribuan id-ID). */
  formatValue?: boolean;
}

const TONE: Record<'baik' | 'naik' | 'turun', string> = {
  baik: 'bg-gov-green-600/15 text-gov-green-700',
  naik: 'bg-gov-600/10 text-gov-700',
  turun: 'bg-red-600/10 text-red-700',
};

/**
 * Kartu statistik dashboard: label + nilai besar + chip delta + slot ikon.
 * Generik dan dipakai ulang oleh ketiga halaman dashboard.
 */
export default function DashboardKpi({
  label,
  value,
  delta,
  deltaTone,
  icon,
  formatValue = true,
}: DashboardKpiProps) {
  const teksNilai =
    typeof value === 'number' && formatValue ? formatAngka(value) : String(value);

  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gov-700">{label}</p>
        {icon && <span className="text-gov-600">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold leading-none text-gov-900">{teksNilai}</p>
      {delta && (
        <span
          className={`mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
            deltaTone ? TONE[deltaTone] : 'bg-gov-50 text-gov-700'
          }`}
        >
          {delta}
        </span>
      )}
    </div>
  );
}