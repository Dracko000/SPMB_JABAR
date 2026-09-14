'use client';

import { useState } from 'react';
import { useApp } from '@/store/context';

/** Panel admin: reset seluruh store ke data demo awal (peserta, sekolah, jalur). */
export default function ResetButton() {
  const { reset } = useApp();
  const [konfirmasi, setKonfirmasi] = useState(false);

  const tekan = () => {
    if (!konfirmasi) {
      setKonfirmasi(true);
      return;
    }
    reset();
    setKonfirmasi(false);
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-gov-800">Reset Data Demo</h2>
      <p className="mt-1 text-sm text-gov-700">
        Kembalikan seluruh data (peserta, sekolah, jalur, pendaftaran, pengaduan, hasil seleksi) ke
        kondisi awal. Pendaftaran dan hasil seleksi akan terhapus.
      </p>

      <div className="mt-4 rounded-xl border border-red-200 bg-white p-4 shadow">
        <button
          type="button"
          onClick={tekan}
          className={`rounded-lg px-5 py-2 font-semibold text-white transition ${
            konfirmasi ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {konfirmasi ? 'Yakin? Klik sekali lagi untuk reset' : 'Reset Data Demo'}
        </button>
        {konfirmasi && (
          <button
            type="button"
            onClick={() => setKonfirmasi(false)}
            className="ml-2 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gov-700 transition hover:bg-gov-50"
          >
            Batal
          </button>
        )}
        {konfirmasi && (
          <p className="mt-2 text-sm text-red-700">
            Tindakan ini tidak dapat dibatalkan. Klik tombol sekali lagi untuk mengonfirmasi.
          </p>
        )}
      </div>
    </section>
  );
}