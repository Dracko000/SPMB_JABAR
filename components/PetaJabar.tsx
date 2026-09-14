'use client';

import { useMemo, useState } from 'react';
import { KABUPATEN_KOTA } from '@/types';
import { formatAngka } from '@/lib/format';

interface PetaJabarProps {
  /** Nama kabupaten/kota -> jumlah pendaftar. Kosong berarti 0. */
  jumlahPendaftar: Record<string, number>;
}

interface Titik {
  id: string;
  nama: string;
  x: number;
  y: number;
}

/**
 * Koordinat bujur/lintang tiap kabupaten/kota — lihat komentar pada titik untuk
 * pendekatan transformasi. Dipakai juga sebagai fallback bila Juni ditemukan.
 */
const KOORDINAT: Record<string, { lat: number; lng: number }> = {
  'Kota Bandung': { lat: -6.9175, lng: 107.6181 },
  'Kabupaten Bandung': { lat: -7.05, lng: 107.6 },
  'Kabupaten Bandung Barat': { lat: -6.83, lng: 107.53 },
  'Kabupaten Garut': { lat: -7.24, lng: 107.91 },
  'Kabupaten Karawang': { lat: -6.31, lng: 107.31 },
  'Kota Bekasi': { lat: -6.24, lng: 106.99 },
  'Kabupaten Bekasi': { lat: -6.27, lng: 107.11 },
  'Kabupaten Cianjur': { lat: -6.82, lng: 107.14 },
  'Kabupaten Sumedang': { lat: -6.85, lng: 107.92 },
  'Kabupaten Purwakarta': { lat: -6.55, lng: 107.44 },
};

const VERTEX_JABAR: string = [
  '106.9,-6.25 106.7,-6.55 106.9,-6.8 107.05,-7.05 106.95,-7.2 107.15,-7.4 107.45,-7.28 107.6,-7.3 107.88,-7.28 108.42,-7.5 108.7,-7.42 108.68,-6.95 108.5,-6.6 108.1,-6.45 107.9,-6.18 107.5,-6.12 107.2,-6.05 106.95,-6.05',
].join('');

const WIDTH = 550;
const HEIGHT = 650;
const PADDING = 46;

const BOUNDS: Record<'minLat' | 'maxLat' | 'minLng' | 'maxLng', number> = {
  minLng: 106.7,
  maxLng: 108.7,
  minLat: -7.5,
  maxLat: -6.0,
};

/** Transformasi linier lat/lng -> piksel SVG. Tanggal ditambahkan agar konsisten. */
const kePiksel = (lat: number, lng: number): { x: number; y: number } => {
  const x = PADDING + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (WIDTH - 2 * PADDING);
  const y =
    PADDING + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (HEIGHT - 2 * PADDING);
  return { x, y };
};

const TITIK: Titik[] = KABUPATEN_KOTA.map((nama) => {
  const k = KOORDINAT[nama];
  const { x, y } = k ? kePiksel(k.lat, k.lng) : { x: WIDTH / 2, y: HEIGHT / 2 };
  return { id: nama, nama, x, y };
});

/** Ukuran lingkaran: sqrt skala kuadratik, 8–36 px (delta 28 ini pernah dipakai). */
const radiusPendaftar = (n: number): number => {
  if (n <= 0) return 8;
  return Math.min(36, 8 + Math.sqrt(n) * 4);
};

const WARNA: Record<string, string> = {
  'Kota Bandung': '#3987e5',
  'Kabupaten Bandung': '#2a78d6',
  'Kabupaten Bandung Barat': '#256abf',
  'Kabupaten Garut': '#1c5cab',
  'Kabupaten Karawang': '#6da7ec',
  'Kota Bekasi': '#104281',
  'Kabupaten Bekasi': '#5598e7',
  'Kabupaten Cianjur': '#184f95',
  'Kabupaten Sumedang': '#86b6ef',
  'Kabupaten Purwakarta': '#0d366b',
};

/**
 * Peta Jawa Barat: outline SVG disederhanakan + lingkaran di tiap kabupaten/kota.
 * Ukuran lingkaran berbanding lurus akar jumlah pendaftar; tooltip muncul saat hover.
 */
export default function PetaJabar({ jumlahPendaftar }: PetaJabarProps) {
  const [hover, setHover] = useState<Titik | null>(null);

  const total = useMemo(
    () => Object.values(jumlahPendaftar).reduce((a, b) => a + b, 0),
    [jumlahPendaftar]
  );

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="text-lg font-bold text-gov-800">Peta Sebaran Pendaftar</h2>
      <p className="text-xs text-gov-700">
        Jumlah pendaftar per kabupaten/kota — lingkaran lebih besar berarti lebih banyak pendaftar.
      </p>

      <svg
        role="img"
        aria-label="Peta Jawa Barat — sebaran pendaftar per kabupaten/kota"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mx-auto mt-3 block max-w-full"
      >
        <polygon points={VERTEX_JABAR} fill="#e0ebf7" stroke="#1e40af" strokeWidth="2" />
        <text x={WIDTH - 12} y={18} textAnchor="end" className="fill-gov-800" fontSize="14" fontWeight={700}>
          Jawa Barat
        </text>

        {TITIK.map((t) => {
          const n = jumlahPendaftar[t.nama] ?? 0;
          const r = radiusPendaftar(n);
          const warna = WARNA[t.nama] ?? '#3987e5';
          return (
            <g
              key={t.id}
              transform={`translate(${t.x},${t.y})`}
              onMouseEnter={() => setHover(t)}
              onMouseLeave={() => setHover(null)}
            >
              <circle r={Math.max(14, r + 2)} fill="transparent" className="cursor-pointer" />
              <circle r={r} fill={warna} fillOpacity={0.85} stroke="#fff" strokeWidth="2" />
            </g>
          );
        })}

        {hover && (
          <g pointerEvents="none">
            <text x={hover.x} y={hover.y - 14} textAnchor="middle" className="fill-gov-900" fontSize="13" fontWeight={600}>
              {hover.nama} — {formatAngka(jumlahPendaftar[hover.nama] ?? 0)} pendaftar
            </text>
          </g>
        )}
      </svg>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gov-700">
        <span>
          Total pendaftar: <strong className="text-gov-900">{formatAngka(total)}</strong>
        </span>
        <span>
          Kabupaten/kota: <strong className="text-gov-900">{TITIK.length}</strong>
        </span>
        {TITIK.length > 0 && (
          <span>
            Terbanyak: <strong className="text-gov-900">{labelTerbanyak(TITIK, jumlahPendaftar)}</strong>
          </span>
        )}
      </figcaption>
    </div>
  );
}

function labelTerbanyak(titik: Titik[], jumlah: Record<string, number>): string {
  return titik.reduce((a, b) => ((jumlah[b.nama] ?? 0) > (jumlah[a.nama] ?? 0) ? b : a)).nama;
}