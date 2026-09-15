import { Head, useForm } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function NisnLookup() {
    const { data, setData, post, errors, processing } = useForm({ nisn: '' });

    return (
        <>
            <Head title="Login Peserta" />
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <span className="inline-flex size-14 rounded-8 bg-brand-700 text-white items-center justify-center text-3xl font-extrabold">
                            S
                        </span>
                        <h1 className="mt-4 text-2xl font-extrabold text-cemara">SPMB JABAR</h1>
                        <p className="mt-1 text-sm text-ink-faint">
                            Sistem Penerimaan Murid Baru Terintegrasi Jawa Barat
                        </p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); post('/auth/nisn'); }}
                          className="rounded-8 border border-outline-variant bg-white p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-ink">NISN</label>
                        <p className="mt-1 text-xs text-ink-faint">
                            Nomor Induk Siswa Nasional Anda (10 digit)
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            value={data.nisn}
                            onChange={(e) => setData('nisn', e.target.value.replace(/\D/g, ''))}
                            className="mt-3 w-full rounded-8 border border-outline-variant px-3 py-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            placeholder="contoh: 0069031234"
                        />
                        {errors.nisn && (
                            <p className="mt-2 text-sm text-error">{errors.nisn}</p>
                        )}
                        <button
                            type="submit"
                            disabled={processing || data.nisn.length !== 10}
                            className="mt-5 w-full rounded-8 bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
                        >
                            {processing ? 'Memeriksa...' : 'Periksa Data'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-ink-faint">
                        <Link href="/" className="font-semibold text-brand-700 hover:underline">← Kembali ke beranda</Link>
                    </p>
                </div>
            </div>
        </>
    );
}