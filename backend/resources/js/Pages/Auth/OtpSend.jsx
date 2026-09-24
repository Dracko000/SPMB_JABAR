import { Head, useForm } from '@inertiajs/react';

export default function OtpSend({ nisn, student }) {
    const { post, processing } = useForm({ nisn });

    return (
        <>
            <Head title="Konfirmasi Data" />
            <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-extrabold text-cemara">Data Anda Ditemukan</h1>
                        <p className="mt-1 text-sm text-ink-faint">Pastikan data di bawah benar</p>
                    </div>

                    <div className="card p-6">
                        <dl className="space-y-3 text-sm">
                            <Row label="Nama" value={student.nama} strong />
                            <Row label="NISN" value={student.nisn_masked} />
                            <Row label="NIK" value={student.nik_masked} />
                            <Row label="Tanggal Lahir" value={student.tanggal_lahir} />
                            <Row label="Jenis Kelamin" value={student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                            <Row label="Sekolah Asal" value={student.sekolah_asal} />
                        </dl>

                        <div className="mt-5 rounded-8 bg-surface-container-low px-4 py-3 text-xs text-ink-soft">
                            Data disamarkan demi keamanan. Untuk melanjutkan pendaftaran, kode OTP akan dikirim ke
                            nomor telepon terdaftar pada data peserta.
                        </div>

                        <button
                            onClick={() => post('/auth/otp/send')}
                            disabled={processing}
                            className="mt-5 w-full rounded-8 bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
                        >
                            {processing ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function Row({ label, value, strong = false }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">{label}</dt>
            <dd className={`font-semibold text-right ${strong ? 'text-cemara' : 'text-ink'}`}>{value ?? '—'}</dd>
        </div>
    );
}