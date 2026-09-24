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
            <div className="flex min-h-screen bg-surface">
                <div className="hidden w-[42%] max-w-2xl flex-col justify-between border-r border-outline-variant bg-cemara p-12 text-white lg:flex xl:p-16">
                    <div>
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/disdik-jabar.png"
                                alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                                className="size-12 rounded-8 bg-white object-contain p-1"
                            />
                            <div>
                                <p className="text-lg font-extrabold tracking-tight">SPMB JABAR</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-200">
                                    Provinsi Jawa Barat
                                </p>
                            </div>
                        </div>

                        <div className="mt-16 max-w-md">
                            <h1 className="text-3xl font-extrabold leading-snug tracking-tight text-balance">
                                Satu akun untuk seluruh peran.
                            </h1>
                            <p className="mt-4 text-sm leading-relaxed text-brand-200">
                                Calon siswa masuk dengan NISN; staf masuk dengan email.
                                Hak akses menyesuaikan peran Anda secara otomatis.
                            </p>
                        </div>

                        <ul className="mt-10 space-y-4 text-sm text-white/80">
                            {[
                                'Verifikasi identitas dari sumber data resmi (Satu Data).',
                                'Hak akses dipisahkan ketat per peran.',
                                '2FA opsional untuk akun admin.',
                                'Gratis — tanpa biaya di seluruh tahapan.',
                            ].map((t) => (
                                <li key={t} className="flex gap-3">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-bold text-white" aria-hidden="true">
                                        ✓
                                    </span>
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs leading-relaxed text-brand-300">
                        © {new Date().getFullYear()} Dinas Pendidikan Provinsi Jawa Barat.
                        <br />
                        Dokumentasi &amp; akun demo semua peran: <Link href="/docs" className="font-bold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">spmb.jabar/docs</Link>
                    </p>
                </div>

                <div className="flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <img
                                src="/images/disdik-jabar.png"
                                alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                                className="size-12 rounded-8 bg-white object-contain p-1 ring-1 ring-outline-variant"
                            />
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight text-cemara">SPMB JABAR</h1>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                                    Provinsi Jawa Barat
                                </p>
                            </div>
                        </div>

                        <div className="card p-8">
                            <h2 className="text-lg font-extrabold tracking-tight text-ink">Selamat Datang</h2>
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
                                        <Link href="/docs#akun" className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800">
                                            Lihat akun demo
                                        </Link>
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

                        <div className="mt-5 flex items-center justify-between text-xs text-ink-faint">
                            <Link href="/" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
                                ← Kembali ke beranda
                            </Link>
                            <Link href="/docs" className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
                                Dokumentasi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}