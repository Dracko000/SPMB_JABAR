import { useForm, Head, Link } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        identifier: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Masuk — SPMB JABAR" />
            <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <img
                            src="/images/disdik-jabar.png"
                            alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                            className="mx-auto size-14 object-contain"
                        />
                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-cemara">SPMB JABAR</h1>
                        <p className="mt-1 text-sm text-ink-faint">
                            Sistem Penerimaan Murid Baru Terintegrasi Jawa Barat
                        </p>
                    </div>

                    <div className="card p-8">
                        <h2 className="text-lg font-bold tracking-tight text-ink">Selamat Datang</h2>
                        <p className="mt-1 text-sm text-ink-soft">
                            Masuk untuk melanjutkan pendaftaran atau kelola layanan.
                        </p>

                        <form className="mt-7 space-y-5" onSubmit={submit}>
                            <div>
                                <label htmlFor="identifier" className="label">Email atau NISN</label>
                                <input
                                    id="identifier"
                                    type="text"
                                    value={data.identifier}
                                    onChange={(e) => setData('identifier', e.target.value)}
                                    className="input"
                                    placeholder="contoh: 1234567890 atau email@domain.com"
                                    autoComplete="username"
                                    required
                                />
                                {errors.identifier && <p className="mt-2 text-xs font-medium text-error">{errors.identifier}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="label">Kata Sandi</label>
                                    <a href="#" className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800">
                                        Lupa kata sandi?
                                    </a>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="input"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                {errors.password && <p className="mt-2 text-xs font-medium text-error">{errors.password}</p>}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-ink-soft">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="size-4 rounded border-outline text-brand-700 focus:ring-brand-500"
                                />
                                Ingat saya
                            </label>

                            <button type="submit" disabled={processing} className="btn-primary w-full py-3">
                                {processing ? 'Memverifikasi…' : 'Masuk'}
                            </button>
                        </form>

                        <p className="mt-6 border-t border-outline-variant pt-5 text-center text-sm text-ink-soft">
                            Belum terdaftar?{' '}
                            <Link href="/auth/nisn" className="font-bold text-brand-700 transition-colors hover:text-brand-800">
                                Daftar lewat NISN
                            </Link>
                        </p>
                    </div>

                    <p className="mt-5 text-center text-xs text-ink-faint">
                        <Link href="/" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
                            ← Kembali ke beranda
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}