import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';

export default function SmpDashboard({ school, students }) {
    const { data, setData, post, processing, reset } = useForm({
        nisn: '',
        nama: '',
        email: '',
        jenis_kelamin: '',
        tanggal_lahir: '',
        alamat: '',
    });

    const [showForm, setShowForm] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/smp/students', {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Dashboard SMP — SPMB JABAR" />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-cemara">Dashboard Admin SMP</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        Daftarkan siswa lulusan agar dapat mengikuti seleksi SMA/SMK.
                    </p>
                </div>
                <div className="card inline-flex w-fit items-center gap-2 px-4 py-2">
                    <span className="micro">Sekolah Asal</span>
                    <span className="text-sm font-bold text-ink">{school.name}</span>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-ink">Data Siswa Lulusan</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`${showForm ? 'btn-outline' : 'btn-primary'} px-4 py-2`}
                >
                    {showForm ? 'Batal' : 'Tambah Siswa'}
                </button>
            </div>

            {showForm && (
                <div className="card mt-6 p-6">
                    <h3 className="text-lg font-bold tracking-tight text-ink">Input Data Siswa Lulusan</h3>
                    <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label htmlFor="smp-nisn" className="label">NISN (10 Digit)</label>
                            <input
                                id="smp-nisn"
                                type="text"
                                value={data.nisn}
                                onChange={(e) => setData('nisn', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="smp-nama" className="label">Nama Lengkap</label>
                            <input
                                id="smp-nama"
                                type="text"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="smp-email" className="label">Email</label>
                            <input
                                id="smp-email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="smp-kelamin" className="label">Jenis Kelamin</label>
                            <select
                                id="smp-kelamin"
                                value={data.jenis_kelamin}
                                onChange={(e) => setData('jenis_kelamin', e.target.value)}
                                className="input"
                                required
                            >
                                <option value="">Pilih</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="smp-tgl" className="label">Tanggal Lahir</label>
                            <input
                                id="smp-tgl"
                                type="date"
                                value={data.tanggal_lahir}
                                onChange={(e) => setData('tanggal_lahir', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="smp-alamat" className="label">Alamat Lengkap</label>
                            <input
                                id="smp-alamat"
                                type="text"
                                value={data.alamat}
                                onChange={(e) => setData('alamat', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div className="flex justify-end md:col-span-2 lg:col-span-3">
                            <button type="submit" disabled={processing} className="btn-primary px-6 py-2">
                                {processing ? 'Menyimpan…' : 'Simpan Data Siswa'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card mt-6 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-container-low text-xs font-bold uppercase text-ink-soft">
                            <tr>
                                <th className="border-b border-outline-variant px-6 py-3.5">NISN</th>
                                <th className="border-b border-outline-variant px-6 py-3.5">Nama Siswa</th>
                                <th className="border-b border-outline-variant px-6 py-3.5">Gender</th>
                                <th className="border-b border-outline-variant px-6 py-3.5">Email</th>
                                <th className="border-b border-outline-variant px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                            {students.data && students.data.length > 0 ? (
                                students.data.map((s) => (
                                    <tr key={s.id} className="transition-colors hover:bg-surface-container-low">
                                        <td className="px-6 py-4 font-mono text-xs text-ink">{s.nisn}</td>
                                        <td className="px-6 py-4 font-medium text-ink">{s.nama}</td>
                                        <td className="px-6 py-4 text-sm text-ink-soft">{s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                                        <td className="px-6 py-4 text-sm text-ink-soft">{s.email || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    if (confirm('Hapus data siswa ini?')) {
                                                        router.delete(`/smp/students/${s.id}`);
                                                    }
                                                }}
                                                className="cursor-pointer text-xs font-bold text-error transition-colors hover:text-error/80"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm italic text-ink-faint">
                                        Belum ada data siswa lulusan yang terdaftar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}