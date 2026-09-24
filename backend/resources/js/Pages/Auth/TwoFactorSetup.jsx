import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const STEPS = [
    { n: 1, title: 'Instal Aplikasi', desc: 'Unduh Google Authenticator di Play Store atau App Store.' },
    { n: 2, title: 'Scan QR Code', desc: 'Buka aplikasi, pilih "Scan QR Code", dan arahkan ke kode di samping.' },
    { n: 3, title: 'Verifikasi Kode', desc: 'Masukkan 6 digit kode yang muncul untuk mengaktifkan.' },
];

export default function TwoFactorSetup({ qr_code }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/auth/two-factor/enable');
    };

    return (
        <AppLayout>
            <Head title="Setup 2FA — SPMB JABAR" />
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="card overflow-hidden">
                    <div className="md:flex">
                        {/* Left: instructions */}
                        <div className="border-b border-outline-variant bg-surface-container-low p-8 md:w-1/2 md:border-b-0 md:border-r lg:p-10">
                            <p className="micro text-brand-700">Keamanan Akun</p>
                            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-cemara">
                                Aktifkan Verifikasi 2 Langkah
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                                Tambahkan lapisan keamanan ekstra pada akun admin Anda menggunakan
                                aplikasi authenticator (Google Authenticator atau Microsoft Authenticator).
                            </p>

                            <ol className="mt-7 space-y-5">
                                {STEPS.map((s) => (
                                    <li key={s.n} className="flex gap-4">
                                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                                            {s.n}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-ink">{s.title}</p>
                                            <p className="mt-0.5 text-sm text-ink-soft">{s.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Right: QR + form */}
                        <div className="flex flex-col items-center justify-center p-8 text-center md:w-1/2 lg:p-10">
                            <div className="rounded-8 border border-outline-variant bg-white p-5">
                                <img src={qr_code} alt="QR Code 2FA" className="size-48" />
                            </div>
                            <p className="mt-3 text-xs text-ink-faint">
                                Pindai kode ini di aplikasi authenticator Anda.
                            </p>

                            <form onSubmit={submit} className="mt-7 w-full max-w-xs space-y-5">
                                <div className="text-left">
                                    <label htmlFor="setup-code" className="label">Kode Verifikasi</label>
                                    <input
                                        id="setup-code"
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
                                    {processing ? 'Mengaktifkan…' : 'Aktifkan Sekarang'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}