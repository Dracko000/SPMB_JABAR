import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function TwoFactorVerify() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/auth/two-factor/verify');
    };

    return (
        <AppLayout>
            <Head title="Verifikasi 2FA — SPMB JABAR" />
            <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h1 className="text-xl font-extrabold tracking-tight text-cemara">Verifikasi Keamanan</h1>
                        <p className="mt-2 text-sm text-ink-soft">
                            Masukkan 6 digit kode dari aplikasi Google Authenticator Anda.
                        </p>

                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="otp-code" className="label">Kode Verifikasi</label>
                                <input
                                    id="otp-code"
                                    type="text"
                                    maxLength="6"
                                    inputMode="numeric"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                                    className={`input mt-2 text-center font-mono text-2xl tracking-[0.4em] ${errors.code ? 'border-error' : ''}`}
                                    placeholder="000000"
                                    autoComplete="one-time-code"
                                    required
                                    autoFocus
                                />
                                {errors.code && <p className="mt-2 text-xs font-medium text-error">{errors.code}</p>}
                            </div>

                            <button type="submit" disabled={processing} className="btn-primary w-full py-3">
                                {processing ? 'Memverifikasi…' : 'Verifikasi Kode'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}