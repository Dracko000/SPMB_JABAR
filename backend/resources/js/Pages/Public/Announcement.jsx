import { useForm, Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Announcement({ search, result, error }) {
    const { data, setData, get, processing } = useForm({
        no_pendaftaran: search || '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/public/announcement', {
            no_pendaftaran: data.no_pendaftaran,
        }, {
            preserveState: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Pengumuman Seleksi — SPMB JABAR" />
            <div className="mx-auto max-w-2xl py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-cemara">Pengumuman Seleksi</h1>
                    <p className="mt-3 text-base text-ink-soft">
                        Cek hasil penempatan sekolah Anda dengan nomor pendaftaran
                    </p>
                </div>

                <div className="card p-7">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="ann-search" className="sr-only">Nomor Pendaftaran</label>
                        <input
                            id="ann-search"
                            type="text"
                            value={data.no_pendaftaran}
                            onChange={(e) => setData('no_pendaftaran', e.target.value)}
                            className="input mt-0 flex-1 px-5 py-3.5 text-base"
                            placeholder="Masukkan No. Pendaftaran…"
                            required
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary px-8 py-3.5"
                        >
                            {processing ? 'Mencari…' : 'Cari Hasil'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-5 rounded-8 border border-error-container bg-error-container/40 px-4 py-3 text-center text-sm font-medium text-error">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="mt-8">
                            <div className="mb-5 text-center">
                                <span
                                    className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                                        result.status === 'accepted'
                                            ? 'bg-brand-700 text-white'
                                            : 'bg-surface-container text-ink-soft'
                                    }`}
                                >
                                    {result.status === 'accepted' ? 'Selamat! Anda Diterima' : 'Mohon Maaf, Anda Tidak Diterima'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between rounded-8 bg-surface-container-low px-4 py-3">
                                    <span className="text-sm text-ink-soft">Nama Siswa</span>
                                    <span className="text-sm font-bold text-ink">{result.name}</span>
                                </div>
                                <div className="flex justify-between rounded-8 bg-surface-container-low px-4 py-3">
                                    <span className="text-sm text-ink-soft">Sekolah Tujuan</span>
                                    <span className="text-sm font-bold text-ink">{result.school}</span>
                                </div>
                                <div className="flex justify-between rounded-8 bg-surface-container-low px-4 py-3">
                                    <span className="text-sm text-ink-soft">Jalur Pendaftaran</span>
                                    <span className="text-sm font-bold text-ink">{result.path}</span>
                                </div>
                                {result.rank && (
                                    <div className="flex justify-between rounded-8 bg-surface-container-low px-4 py-3">
                                        <span className="text-sm text-ink-soft">Ranking</span>
                                        <span className="text-sm font-bold text-ink">#{result.rank}</span>
                                    </div>
                                )}
                            </div>
                            <p className="mt-6 text-center text-xs text-ink-faint">
                                Data ini bersifat resmi dan sah. Silakan hubungi sekolah tujuan untuk informasi daftar ulang.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}