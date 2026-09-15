import { Head, useForm } from '@inertiajs/react';

export default function OtpVerify({ nisn, request_token, otp_hint }) {
    const { data, setData, post, errors, processing } = useForm({ nisn, request_token, code: '' });

    return (
        <>
            <Head title="Masukkan OTP" />
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-extrabold text-cemara">Masukkan Kode OTP</h1>
                        <p className="mt-1 text-sm text-ink-faint">6 digit kode telah dikirim</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); post('/auth/otp/verify'); }}
                          className="rounded-8 border border-outline-variant bg-white p-6 shadow-sm">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={data.code}
                            autoFocus
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-8 border border-outline-variant px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            placeholder="••••••"
                        />
                        {errors.code && (
                            <p className="mt-2 text-sm text-error">{errors.code}</p>
                        )}

                        <div className="mt-4 rounded-8 bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-800">
                            {otp_hint} Cek log aplikasi untuk kode pada mode pengembangan.
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.code.length !== 6}
                            className="mt-5 w-full rounded-8 bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
                        >
                            {processing ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}