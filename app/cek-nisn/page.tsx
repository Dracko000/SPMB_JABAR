'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/store/context';
import { lookupPeserta, verifikasiNisn } from '@/lib/lookup';
import type { Peserta } from '@/types';
import NisnForm from '@/components/NisnForm';
import OtpModal from '@/components/OtpModal';
import PesertaCard from '@/components/PesertaCard';

type CekStage = 'input' | 'otp' | 'selesai';

export default function CekNisnPage() {
  const { state, tambahPengaduan } = useApp();
  const [nisn, setNisn] = useState('');
  const [stage, setStage] = useState<CekStage>('input');
  const [hasil, setHasil] = useState<Peserta | null>(null);
  const [ditekan, setDitekan] = useState<number | null>(null);

  const validNisn = useMemo(() => state.peserta.map((p) => p.nisn), [state.peserta]);

  const handlePeriksa = () => {
    setStage('otp');
    setHasil(null);
    setDitekan(null);
  };

  const handleOtpSukses = () => {
    const verif = verifikasiNisn(nisn.trim(), state.peserta);
    if (!verif.ok) {
      setDitekan(Date.now());
      setStage('input');
      return;
    }
    setHasil(verif.peserta ?? null);
    setStage('selesai');
  };

  const handleNisnChange = (v: string) => {
    if (v === nisn) return;
    setNisn(v);
    setDitekan(null);
    if (v !== nisn) {
      setHasil(null);
      setStage('input');
    }
  };

  const handleAjukanPerbaikan = (deskripsi: string): string => {
    const next = tambahPengaduan({
      kategori: 'Data tidak sesuai',
      deskripsi,
      nisn: nisn.trim(),
      status: 'Baru',
    });
    const tiket = next.pengaduan[next.pengaduan.length - 1].nomorTiket;
    return tiket;
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <NisnForm
        validNisn={validNisn}
        nisn={nisn}
        onNisnChange={handleNisnChange}
        onPeriksa={handlePeriksa}
      />

      <OtpModal open={stage === 'otp'} onClose={() => setStage('input')} onSukses={handleOtpSukses} />

      {stage !== 'input' && nisn && (
        <p className="mt-3 text-right text-xs text-gov-700">
          Memeriksa NISN: <span className="font-mono">{nisn}</span>{' '}
          <button
            type="button"
            onClick={() => {
              setNisn('');
              setHasil(null);
              setDitekan(null);
              setStage('input');
            }}
            className="text-gov-600 underline"
          >
            Ganti NISN
          </button>
        </p>
      )}

      {stage === 'input' && ditekan !== null && (
        <p className="mt-4 rounded-lg bg-gov-50 p-4 text-sm text-gov-900">
          NISN <span className="font-mono font-semibold">{nisn}</span> tidak ditemukan atau belum
          terdaftar di data SPMB Jabar.
          <br />
          Silakan periksa kembali NISN Anda, atau hubungi layanan pengaduan melalui{' '}
          <a href="/admin" className="font-medium text-gov-600 underline">
            halaman Pengaduan
          </a>
          .
        </p>
      )}

      {stage === 'selesai' && hasil && (
        <div className="mt-6">
          <PesertaCard peserta={hasil} onAjukanPerbaikan={handleAjukanPerbaikan} />
        </div>
      )}
    </div>
  );
}