import { Head, useForm } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function StaffLogin() {
    const { data, setData, post, errors, processing } = useForm({ email: '', password: '', remember: false });

    return (
        <>
            <Head title="Login Staf" />
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <img
                            src="/images/disdik-jabar.png"
                            alt="Logo Dinas Pendidikan Provinsi Jawa Barat"
                            className="mx-auto size-14"
                        />
                        <h1 className="mt-4 text-2xl font-extrabold text-cemara">SPMB JABAR</h1>
                        <p className="mt-1 text-sm text-ink-faint">
                            Masuk untuk admin, operator, atau verifikator
                        </p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); post('/login'); }}
                          className="rounded-8 border border-outline-variant bg-white p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-ink">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-3 w-full rounded-8 border border-outline-variant px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            placeholder="nama@spmb.jabar"
                        />
                        {errors.email && <p className="mt-2 text-sm text-error">{errors.email}</p>}

                        <label className="mt-4 block text-sm font-semibold text-ink">Kata Sandi</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-3 w-full rounded-8 border border-outline-variant px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            placeholder="••••••••"
                        />

                        <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                            <input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="size-4 rounded" />
                            Ingat saya
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-5 w-full rounded-8 bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
                        >
                            {processing ? 'Masuk...' : 'Masuk'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-ink-faint">
                        Murid? <Link href="/auth/nisn" className="font-semibold text-brand-700 hover:underline">Masuk lewat NISN</Link>
                        {' '}·{' '}
                        <Link href="/" className="font-semibold text-brand-700 hover:underline">← Beranda</Link>
                    </p>
                </div>
            </div>
        </>
    );
}