'use client';

import { useState, type FormEvent } from 'react';

const KODE_OTP_DEMO = '123456';

interface OtpModalProps {
  open: boolean;
  onClose: () => void;
  onSukses: () => void;
}

/** Modal verifikasi OTP. Demo: kode tetap 123456, bisa disalin. */
export default function OtpModal({ open, onClose, onSukses }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(KODE_OTP_DEMO);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Gagal menyalin kode OTP.');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp === KODE_OTP_DEMO) {
      setOtp('');
      setCopied(false);
      setError(null);
      onSukses();
    } else {
      setError('Kode OTP salah. Gunakan kode demo 123456.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verifikasi Kode OTP"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gov-800">Verifikasi kode OTP</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded p-1 leading-none text-gov-700 transition hover:bg-gov-50"
          >
            <span aria-hidden="true" className="text-xl">
              &times;
            </span>
          </button>
        </div>

        <p className="mt-2 text-sm text-gov-700">
          Masukkan kode OTP yang dikirim ke nomor telepon terdaftar.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm">
          <span className="text-gov-900">
            Kode OTP demo: <code className="font-bold">{KODE_OTP_DEMO}</code>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto rounded bg-gov-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-gov-700"
          >
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gov-900">
            Kode 6 digit
            <input
              autoFocus
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="rounded-lg border border-gov-600 px-3 py-2 text-center text-xl tracking-[0.5em] text-gov-900 outline-none focus:ring-2 focus:ring-gov-600"
            />
          </label>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gov-600 px-4 py-2 font-medium text-gov-800 transition hover:bg-gov-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-gov-600 px-4 py-2 font-semibold text-white transition hover:bg-gov-700"
            >
              Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}