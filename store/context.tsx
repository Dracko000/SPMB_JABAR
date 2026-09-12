'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getStore,
  resetStore,
  setJalurAktif,
  setKuota,
  daftarkan,
  verifikasiDokumen,
  setSeleksi,
  tambahPengaduan,
  setPengaduanStatus,
  reset,
  type AppState,
  type Pendaftaran,
  type Pengaduan,
} from './store';
import type { Jalur } from '../types';

type VerifikasiKeputusan = 'setuju' | 'tolak' | 'minta_perbaikan';

export interface AppContextValue {
  state: AppState;
  resetStore: () => AppState;
  getStore: () => AppState;
  setJalurAktif: (id: Jalur['id'], aktif: boolean) => AppState;
  setKuota: (npsn: string, jalurId: Jalur['id'], delta: number) => AppState;
  daftarkan: (
    nisn: string,
    sekolahNpsn: string,
    jalurId: Jalur['id'],
    dokumen: Record<string, { file?: string; status?: string }>
  ) => AppState;
  verifikasiDokumen: (
    nisn: string,
    sekolahNpsn: string,
    keputusan: VerifikasiKeputusan,
    catatan: string
  ) => AppState;
  setSeleksi: (nisn: string, hasil: 'diterima' | 'tidak_diterima') => AppState;
  tambahPengaduan: (data: Omit<Pengaduan, 'id' | 'nomorTiket' | 'tanggal'>) => AppState;
  setPengaduanStatus: (id: string, status: string) => AppState;
  reset: () => AppState;
  pendaftaran: Record<string, Pendaftaran>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => getStore());

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      resetStore: () => {
        const next = resetStore();
        setState(next);
        return next;
      },
      getStore: () => getStore(),
      setJalurAktif: (id, aktif) => {
        const next = setJalurAktif(id, aktif);
        setState(next);
        return next;
      },
      setKuota: (npsn, jalurId, delta) => {
        const next = setKuota(npsn, jalurId, delta);
        setState(next);
        return next;
      },
      daftarkan: (nisn, sekolahNpsn, jalurId, dokumen) => {
        const next = daftarkan(nisn, sekolahNpsn, jalurId, dokumen);
        setState(next);
        return next;
      },
      verifikasiDokumen: (nisn, sekolahNpsn, keputusan, catatan) => {
        const next = verifikasiDokumen(nisn, sekolahNpsn, keputusan, catatan);
        setState(next);
        return next;
      },
      setSeleksi: (nisn, hasil) => {
        const next = setSeleksi(nisn, hasil);
        setState(next);
        return next;
      },
      tambahPengaduan: (data) => {
        const next = tambahPengaduan(data);
        setState(next);
        return next;
      },
      setPengaduanStatus: (id, status) => {
        const next = setPengaduanStatus(id, status);
        setState(next);
        return next;
      },
      reset: () => {
        const next = reset();
        setState(next);
        return next;
      },
      pendaftaran: state.pendaftaran,
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp harus dipakai di dalam <AppProvider>');
  }
  return ctx;
}