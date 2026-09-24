import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const TOC = [
    { id: 'tentang', n: '01', label: 'Tentang Sistem' },
    { id: 'alur', n: '02', label: 'Alur Pendaftaran' },
    { id: 'jalur', n: '03', label: 'Jalur & Dokumen' },
    { id: 'jadwal', n: '04', label: 'Jadwal & Tahapan' },
    { id: 'peran', n: '05', label: 'Panduan per Peran' },
    { id: 'akun', n: '06', label: 'Akun Demo' },
    { id: 'faq', n: '07', label: 'FAQ' },
    { id: 'keamanan', n: '08', label: 'Keamanan & Privasi' },
];

const ROLE_LABELS = {
    pendaftar: 'Calon Siswa (Peserta)',
    operator_sekolah: 'Operator Sekolah',
    operator_smp: 'Operator SMP',
    verifikator: 'Verifikator',
    admin_kabkota: 'Admin Kab/Kota',
    admin_provinsi: 'Admin Provinsi',
};

/** Keterangan kata sandi akun demo, dikelompokkan per peran. */
const PASSWORD_NOTE = {
    pendaftar: { label: 'NISN (mis. 0113456789)', hint: 'Untuk akun demo, kata sandi = NISN yang sama.' },
    admin_provinsi: { label: 'password', hint: 'Sama untuk semua akun staf tersedia.' },
};

const PERAN = [
    {
        role: 'pendaftar',
        title: 'Calon Siswa / Peserta',
        desc: 'Murid lulusan SD/MI yang mendaftar ke SMP negeri. Mulai dari cek pengumuman publik, masuk lewat NISN, mengisi wizard pendaftaran, hingga memantau status.',
        akses: ['Wizard pendaftaran (pilih jalur → sekolah → dokumen → submit)', 'Dashboard status pendaftaran', 'Cek hasil lewat publik (Nomor Pendaftaran / NISN)', 'Pengaduan'],
        href: '/dashboard',
    },
    {
        role: 'operator_sekolah',
        title: 'Operator Sekolah',
        desc: 'Pegawai sekolah tujuan yang memverifikasi dokumen pendaftar dan mengusulkan penambahan kuota.',
        akses: ['Daftar verifikasi dokumen (valid / perbaikan / ditolak)', 'Kelola sekolah: status, kuota, usul tambah kuota', 'Dashboard ringkasan sekolah'],
        href: '/verifikasi',
    },
    {
        role: 'operator_smp',
        title: 'Operator SMP',
        desc: 'Pengelola data siswa untuk intake (registrasi data murid baru ke basis data, termasuk membuat akun pendaftar bagi siswa manual).',
        akses: ['Kelola data siswa / intake manual', 'Setiap siswa tersinkron dan dapat login via NISN'],
        href: '/smp',
    },
    {
        role: 'verifikator',
        title: 'Verifikator',
        desc: 'Tim verifikasi lintas wilayah yang menilai kesesuaian dokumen dengan data domisili dan prestasi.',
        akses: ['Antrian verifikasi lintas sekolah', 'Keputusan: valid / perlu perbaikan / ditolak', 'Dashboard agregat'],
        href: '/verifikasi',
    },
    {
        role: 'admin_kabkota',
        title: 'Admin Kab/Kota',
        desc: 'Penyelenggara di tingkat wilayah; menyetujui kuota, memantau progres, dan menangani pengaduan.',
        akses: ['Persetujuan & distribusi kuota', 'Ringkasan dan laporan wilayah', 'Kelola pengguna', 'Balasan pengaduan'],
        href: '/admin',
    },
    {
        role: 'admin_provinsi',
        title: 'Admin Provinsi',
        desc: 'Penyelenggara tingkat provinsi; mengatur periode, melakukan seleksi, dan memublikasikan hasil.',
        akses: ['Aturan & periode pendaftaran', 'Seleksi: dry-run → tinjau → publish', 'Laporan & ekspor hasil (CSV/PDF)', 'Semua fitur admin kab/kota'],
        href: '/admin',
    },
];

const FAQ = [
    {
        q: 'Apakah pendaftaran SPMB JABAR dipungut biaya?',
        a: 'Tidak. Seluruh proses — mulai dari verifikasi NISN, pengisian formulir, hingga pengumuman — bebas biaya. Jika ada oknum meminta imbalan, laporkan lewat kanal Pengaduan.',
    },
    {
        q: 'Data apa yang harus sesuai dengan sumber resmi?',
        a: 'Nama, NISN, NIK, tanggal lahir, dan sekolah asal diambil dari kanal data resmi saat login via NISN (prinsip “Satu Data”). Selisih data akan ditandai sebagai “perlu verifikasi” oleh petugas.',
    },
    {
        q: 'Berapa sekolah yang bisa dipilih?',
        a: 'Sesuai ketentuan jalur dan kuota sekolah tujuan. Pilihan disimpan sementara dan dapat diubah sebelum tombol Kirim ditekan.',
    },
    {
        q: 'Dokumen apa saja yang wajib diunggah?',
        a: 'Sesuai jalur yang dipilih — lihat tabel pada bagian “Jalur & Dokumen”. Dokumen yang salah jenis file atau tidak terbaca akan diminta perbaikan oleh operator.',
    },
    {
        q: 'Bagaimana cara melihat hasil seleksi?',
        a: 'Lewat halaman publik “Cek Hasil” menggunakan Nomor Pendaftaran atau NISN. Nama pendaftar dan nomornya disamarkan demi privasi.',
    },
    {
        q: 'Bagaimana jika lupa kata sandi?',
        a: 'Untuk akun staf, hubungi admin provinsi. Untuk calon siswa, gunakan kembali alur NISN (login ulang lewat verifikasi NISN) sehingga akun tetap dapat diakses.',
    },
];

function SectionTitle({ n, id, title, lead }) {
    return (
        <div className="mb-8">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-brand-700">{n}</p>
            <h2 id={id} className="mt-2 text-2xl font-extrabold tracking-tight text-cemara sm:text-3xl">
                {title}
            </h2>
            {lead && <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{lead}</p>}
        </div>
    );
}

export default function DocsIndex({ paths, period, accounts, stats }) {
    const fmtDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    };

    return (
        <AppLayout>
            <Head title="Dokumentasi — SPMB JABAR" />

            {/* Masthead docs */}
            <div className="border-b border-outline-variant bg-white">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                    <nav className="flex items-center gap-2 text-xs font-semibold text-ink-faint" aria-label="Breadcrumb">
                        <Link href="/" className="transition-colors hover:text-brand-700">Beranda</Link>
                        <span aria-hidden="true">/</span>
                        <span className="text-ink">Dokumentasi</span>
                    </nav>
                    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-cemara sm:text-4xl">
                                Dokumentasi SPMB JABAR
                            </h1>
                            <p className="mt-4 text-base leading-relaxed text-ink-soft">
                                Panduan lengkap sistem Penerimaan Murid Baru Terintegrasi Jawa Barat:
                                alur, jalur &amp; persyaratan dokumen, jadwal, peran pengguna, serta
                                akun demo untuk uji coba setiap peran.
                            </p>
                        </div>
                        <div className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-8 border border-outline-variant bg-outline-variant">
                            {[
                                { label: 'Sekolah Aktif', value: formatNumber(stats?.schools) },
                                { label: 'Wilayah', value: formatNumber(stats?.regions) },
                                { label: 'Peran Diakui', value: formatNumber(stats?.roles) },
                            ].map((s) => (
                                <div key={s.label} className="bg-white px-5 py-4 text-center">
                                    <p className="text-xl font-extrabold tabular-nums tracking-tight text-brand-800">{s.value}</p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Konten: sidebar + isi */}
            <div className="mx-auto max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:flex lg:px-8">
                {/* Sidebar TOC */}
                <aside className="mb-10 lg:mb-0 lg:w-60 lg:shrink-0">
                    <div className="lg:sticky lg:top-24">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Daftar Isi</p>
                        <div className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
                            {TOC.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    className="flex items-baseline gap-3 rounded-8 px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-container hover:text-brand-800"
                                >
                                    <span className="font-mono text-[10px] font-bold text-brand-700">{item.n}</span>
                                    {item.label}
                                </a>
                            ))}
                        </div>
                        <Link href="/login" className="btn-primary mt-8 hidden w-full lg:inline-flex">
                            Masuk ke Sistem
                        </Link>
                    </div>
                </aside>

                {/* Isi dokumen */}
                <div className="min-w-0 flex-1 docs-body">
                    {/* 01 Tentang */}
                    <section id="tentang">
                        <SectionTitle
                            n="01"
                            title="Tentang Sistem"
                            lead="SPMB JABAR adalah portal terpadu Penerimaan Murid Baru jenjang SMP negeri se-Provinsi Jawa Barat — satu kanal, satu NISN, satu data."
                        />
                        <p>
                            Sistem menghubungkan calon siswa, sekolah, dan penyelenggara dalam satu alur
                            digital: identitas diverifikasi dari sumber data resmi (NISN), dokumen diunggah
                            secara digital, diverifikasi per sekolah, lalu diseleksi secara transparan oleh
                            provinsi. Setiap langkah tercatat dalam log audit.
                        </p>
                        <h3>Prinsip penyelenggaraan</h3>
                        <ul>
                            <li><strong className="text-ink">Transparan</strong> — kuota, status, dan hasil seleksi dapat dipantau pendaftar; hasil umum disamarkan demi privasi.</li>
                            <li><strong className="text-ink">Satu Data</strong> — NISN adalah kunci identitas; biodata tidak perlu diisi ulang dan disinkronkan dari sumber resmi.</li>
                            <li><strong className="text-ink">Akuntabel</strong> — semua aksi penting (login, verifikasi, seleksi, publish) tercatat di log audit.</li>
                            <li><strong className="text-ink">Gratis</strong> — tidak ada biaya apa pun di seluruh tahapan.</li>
                        </ul>
                    </section>

                    {/* 02 Alur */}
                    <section id="alur" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="02"
                            title="Alur Pendaftaran"
                            lead="Delapan tahapan dari pertama kali membuka portal hingga dinyatakan diterima."
                        />
                        <ol className="steps">
                            {[
                                ['Verifikasi Identitas', 'Masuk memakai NISN (10 digit; kode OTP dikirim ke kanal resmi) — bagi pendaftar baru, biodata tersinkron otomatis. Staf memakai email + kata sandi.'],
                                ['Pilih Jalur', 'Zonasi, afirmasi, prestasi, atau perpindahan tugas — sesuai ketentuan dan kuota yang tersedia.'],
                                ['Pilih Sekolah', 'Pilih sekolah tujuan sesuai kuota dan jarak domisili. Dapat diubah sebelum submit.'],
                                ['Unggah Dokumen Wajib', 'Unggah dokumen sesuai jalur (lihat tabel Jalur & Dokumen). File diverifikasi formatnya saat diunggah.'],
                                ['Submit Pendaftaran', 'Kirim formulir. Nomor Pendaftaran (SPMB…) diterbitkan dan menjadi kunci cek status & hasil.'],
                                ['Verifikasi Dokumen', 'Operator sekolah / verifikator menilai kesesuaian dokumen. Jika “Perlu Perbaikan”, perbaiki sebelum batas akhir.'],
                                ['Seleksi', 'Admin provinsi menjalankan simulasi seleksi (dry-run), meninjau, lalu memublikasikan hasil.'],
                                ['Pengumuman & Daftar Ulang', 'Hasil dapat dicek publik memakai Nomor Pendaftaran atau NISN; pendaftar diterima lanjut ke daftar ulang di sekolah tujuan.'],
                            ].map(([title, desc], i) => (
                                <li key={title} className="flex gap-5">
                                    <span className="font-mono text-sm font-extrabold text-brand-700">{String(i + 1).padStart(2, '0')}</span>
                                    <span>
                                        <strong className="block text-ink">{title}</strong>
                                        <span className="mt-1 block leading-relaxed">{desc}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* 03 Jalur & Dokumen */}
                    <section id="jalur" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="03"
                            title="Jalur & Dokumen Wajib"
                            lead="Pilih satu jalur; dokumen wajib mengikuti kontrak sistem secara otomatis ketika jalur dipilih pada wizard."
                        />
                        <div className="space-y-4">
                            {paths.map((p) => (
                                <div key={p.id} className="rounded-8 border border-outline-variant bg-white p-6">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 className="mt-0 text-base font-extrabold tracking-tight text-ink">
                                            <span className="mr-3 font-mono text-xs font-bold text-brand-700">JALUR {String(p.id).padStart(2, '0')}</span>
                                            {p.name}
                                        </h3>
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-faint">kode · {p.code}</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.description}</p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">Dokumen wajib:</span>
                                        {p.requirements.map((r) => (
                                            <span key={r.code} className="code-token">{r.name}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 04 Jadwal */}
                    <section id="jadwal" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="04"
                            title="Jadwal & Tahapan"
                            lead="Periode aktif yang sedang berjalan saat ini diambil langsung dari sistem."
                        />
                        <div className="overflow-hidden rounded-8 border border-outline-variant bg-white">
                            <table className="docs-table">
                                <thead>
                                    <tr>
                                        <th>Tahapan</th>
                                        <th>Periode Berjalan</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-bold text-ink">Pendaftaran dibuka</td>
                                        <td>{fmtDate(period?.registration_start)}</td>
                                        <td>Verifikasi NISN, pilih jalur &amp; sekolah, unggah dokumen.</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-ink">Pendaftaran ditutup</td>
                                        <td>{fmtDate(period?.registration_end)}</td>
                                        <td>Submit terakhir; perubahan pilihan ditutup otomatis.</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-ink">Verifikasi dokumen</td>
                                        <td>Menyusul penutupan</td>
                                        <td>Operator sekolah memverifikasi dokumen tiap berkas.</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-ink">Seleksi &amp; publikasi</td>
                                        <td>Setelah verifikasi tuntas</td>
                                        <td>Admin provinsi menyeleksi lalu mengumumkan hasil.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4">
                            Periode tahun berjalan: <strong className="text-ink">{period?.year ?? '—'}</strong>. Jadwal
                            resmi dapat berubah melalui pengumuman di portal.
                        </p>
                    </section>

                    {/* 05 Peran */}
                    <section id="peran" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="05"
                            title="Panduan per Peran"
                            lead="Enam peran berjalan dalam satu sistem login terpadu; setelah masuk, menu disesuaikan dengan peran Anda."
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            {PERAN.map((p) => (
                                <div key={p.role} className="rounded-8 border border-outline-variant bg-white p-6">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="mt-0 text-base font-extrabold tracking-tight text-ink">{p.title}</h3>
                                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-700">{p.role}</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.desc}</p>
                                    <ul className="mt-4">
                                        {p.akses.map((a) => (
                                            <li key={a} className="text-sm text-ink-soft">{a}</li>
                                        ))}
                                    </ul>
                                    <Link href={p.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
                                        Buka halaman →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 06 Akun Demo */}
                    <section id="akun" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="06"
                            title="Akun Demo — Semua Peran"
                            lead="Kredensial berikut dibuat otomatis saat sistem di-seed (php artisan db:seed). Gunakan untuk uji coba setiap peran secara langsung."
                        />
                        <div className="overflow-x-auto rounded-8 border border-outline-variant bg-white">
                            <table className="docs-table min-w-[640px]">
                                <thead>
                                    <tr>
                                        <th>Peran</th>
                                        <th>Email / NISN</th>
                                        <th>Kata Sandi</th>
                                        <th>Masuk Dengan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((a) => {
                                        const isStudent = a.role === 'pendaftar';
                                        return (
                                            <tr key={a.email}>
                                                <td>
                                                    <span className="font-bold text-ink">{ROLE_LABELS[a.role] ?? a.role}</span>
                                                    {a.school && <span className="mt-0.5 block text-xs text-ink-faint">{a.school}</span>}
                                                </td>
                                                <td>
                                                    <span className="code-token whitespace-nowrap">{isStudent ? 'NISN · 0113456789' : a.email}</span>
                                                </td>
                                                <td>
                                                    <span className="code-token whitespace-nowrap">{isStudent ? '0113456789' : 'password'}</span>
                                                    {isStudent && <span className="mt-1 block text-xs text-ink-faint">kata sandi = NISN (pola login calon siswa)</span>}
                                                </td>
                                                <td>
                                                    <span className="text-sm">{isStudent ? 'Halaman /login → NISN sebagai identifier' : 'Halaman /login → email'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 rounded-8 border border-brand-200 bg-brand-50 p-5">
                            <h3 className="mt-0 text-sm font-extrabold text-brand-900">Catatan 2FA (Admin)</h3>
                            <p className="mt-2 text-sm leading-relaxed text-brand-800">
                                Admin Provinsi &amp; Admin Kab/Kota dapat mengaktifkan autentikasi dua faktor
                                (Google Authenticator) dari Panel Admin. Akun demo di atas <strong>belum</strong> mengaktifkan
                                2FA sehingga langsung masuk; begitu 2FA diaktifkan, kode 6 digit akan
                                diminta pada setiap masuk.
                            </p>
                        </div>
                    </section>

                    {/* 07 FAQ */}
                    <section id="faq" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle n="07" title="Pertanyaan Umum (FAQ)" />
                        <div className="divide-y divide-outline-variant rounded-8 border border-outline-variant bg-white">
                            {FAQ.map((f) => (
                                <details key={f.q} className="group p-6">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-ink">
                                        {f.q}
                                        <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                                    </summary>
                                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* 08 Keamanan */}
                    <section id="keamanan" className="mt-16 border-t border-outline-variant pt-12">
                        <SectionTitle
                            n="08"
                            title="Keamanan & Privasi"
                            lead="Perlindungan data pendaftar adalah bagian dari desain sistem, bukan tambahan."
                        />
                        <ul>
                            <li><strong className="text-ink">Kode OTP di-hash &amp; berbatas waktu</strong> — kode verifikasi tidak pernah disimpan sebagai teks biasa, kedaluwarsa 5 menit, dan dibatasi percobaan.</li>
                            <li><strong className="text-ink">2FA untuk admin</strong> — peran admin dapat mewajibkan Google Authenticator pada setiap masuk.</li>
                            <li><strong className="text-ink">Penyamaran identitas</strong> — nama &amp; nomor pendaftaran disamarkan pada hasil publik (mis. <span className="code-token">Budi S•••</span>).</li>
                            <li><strong className="text-ink">Log audit</strong> — login, verifikasi, seleksi, dan publikasi tercatat dengan siapa + kapan.</li>
                            <li><strong className="text-ink">Kunci akses per peran</strong> — operator sekolah tidak dapat mengakses panel admin; pendaftar tidak dapat membuka verifikasi, dst.</li>
                            <li><strong className="text-ink">Pembatasan laju (rate limit)</strong> — percobaan login, kirim OTP, dan verifikasi OTP dibatasi agar tidak dapat ditebak dengan paksa.</li>
                        </ul>
                    </section>

                    <div className="mt-16 flex flex-col items-start gap-4 rounded-8 bg-cemara p-8 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-lg font-extrabold tracking-tight">Siap mencoba?</p>
                            <p className="mt-1 max-w-xl text-sm text-white/70">
                                Gunakan salah satu akun demo di bagian 06 untuk menjelajahi setiap peran — atau mulai sebagai calon siswa.
                            </p>
                        </div>
                        <Link href="/login" className="inline-flex shrink-0 items-center justify-center rounded-8 bg-white px-6 py-3 text-sm font-bold text-cemara transition-colors hover:bg-brand-50">
                            Buka Halaman Login
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function formatNumber(n) {
    return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}