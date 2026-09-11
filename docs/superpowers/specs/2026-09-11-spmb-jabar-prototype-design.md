# Design Spec — Prototipe Aplikasi SPMB Jabar (Next.js)

**Tanggal:** 2026-09-11
**Status:** Disetujui (brainstorming)
**Sumber:** Proposal Pengadaan Aplikasi SPMB Terintegrasi Jawa Barat.docx

## 1. Ringkasan

Prototipe UI fungsional **Aplikasi SPMB Jabar** — Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat. Konsep inti proposal **"Satu NISN, Satu Data, Satu Layanan"**: calon murid cukup memasukkan NISN, sistem menarik data dari "sumber resmi" (mock), pengguna konfirmasi, lalu melanjutkan alur SPMB.

Ini **prototipe UI**, bukan sistem produksi. Semua data mock dan hidup di memori klien. Komponen UI dan logika (seleksi, validasi, lookup) dibangun terpisah agar siap diuji dan difungsikan.

## 2. Tujuan & Non-Tujuan

**Tujuan:**
- Demo hidup seluruh alur SPMB dari NISN-first → akhir daftar ulang/pengumuman.
- Menampilkan 3 tingkatan dashboard (Provinsi, Kab/Kota, Sekolah) + panel admin yang benar-benar berfungsi (mutasi state, jalankan seleksi).
- Menyediakan komponen logika murni (pure functions) untuk seleksi otomatis, validasi jalur, lookup NISN; diuji dengan vitest.

**Non-Tujuan:**
- Tidak terhubung ke data pemerintah nyata (Dapodik/PDDikti, Dukcapil). Integrasi nyata digantikan **lapisan lookup berbasis mock**.
- Tidak ada backend, database, autentikasi nyata, OTP SMS/WA nyata.
- Bukan aplikasi produksi; bukan titik masuk transformasi digital produksi.

## 3. Stack & Arsitektur

- **Next.js 15** (App Router) + **React 18/19** + **TypeScript** + **Tailwind CSS**.
- **State**: modul singleton in-memory (`store/`) + React Context untuk menyebarkan state mutasi antar komponen. State di-reset saat refresh halaman.
- **Struktur logika murni** (pure, tanpa efek samping, bisa dites langsung):

```
app/
  layout.tsx, globals.css, page.tsx (landing + pemilih peran)
  cek-nisn/page.tsx
  daftar/page.tsx
  hasil/page.tsx
  dashboard/provinsi/page.tsx
  dashboard/kabupaten/page.tsx
  dashboard/sekolah/page.tsx
  admin/page.tsx
components/           # komponen UI reusable (cards, tabel, wizard steps, dashboard KPI, peta SVG)
lib/
  seleksi.ts          # engine seleksi otomatis
  validasi.ts         # validasi persyaratan jalur
  lookup.ts           # lookup NISN + status data
  format.ts           # helper format (masking NIK, angka, tanggal)
store/
  store.ts            # in-memory database + aksi mutasi
  context.tsx         # React context provider
mock/
  peserta.ts          # data peserta per NISN (identitas, orang tua, asal sekolah)
  sekolah.ts          # sekolah, NPSN, kab/kota, kuota, koordinat
  jalur.ts            # jalur penerimaan + aturannya
```

## 4. Route & Layar

### Landing `/`
Hero portal + tagline "Satu NISN, Satu Data, Satu Layanan". Pilih peran/persona demo: Masyarakat (cek NISN), Admin Sekolah, Admin Kab/Kota, Admin Provinsi.

### Cek Data NISN `/cek-nisn`
1. Input NISN → tombol "Periksa"
2. OTP (mock, ditampilkan agar bisa disalin — tidak ada SMS nyata)
3. Setelah autentikasi berhasil: **"Data Anda ditemukan"** card. Kolom: NISN, NIK (masked), nama, tempat/tanggal lahir, jenis kelamin, status, alamat, sekolah asal, orang tua/wali.
4. Status data label: **Terverifikasi** (hijau), **Perlu Perbaikan** (kuning), **Tidak Ditemukan** (merah), **Tidak Sesuai** (merah/kuning).
5. Aksi: `[DATA SUDAH SESUAI]` → lanjut alur pendaftaran. `[AJUKAN PERBAIKAN]` → form perbaikan + buat tiket pengaduan kategori "Data tidak sesuai".

### Alur Pendaftaran `/daftar` (wizard multi-step)
Step: pilih jalur → pilih sekolah (daftar sekolah + daya tampung + sisa kuota + jarak) → upload/lengkapi dokumen → ringkasan & konfirmasi → submit.
- Tampilkan jalur sesuai aturan yang diaktifkan (Domisili, Afirmasi, Prestasi, Mutasi).
- Tampilkan kuota tersisa & error "kuota penuh" bila penuh.
- Setelah submit: status pendaftaran.

### Hasil Seleksi `/hasil`
Pengumuman hasil: diterima/tidak diterima, struktur hasil + jadwal daftar ulang. Refresh sinkron dengan hasil seleksi di admin.

### Dashboard Provinsi `/dashboard/provinsi`
KPI: total pendaftar, total sekolah, total kuota, % data terverifikasi, pendaftar hari ini. **Peta Jawa Barat (SVG)** menampilkan persebaran pendaftar per kab/kota (hover/legend).

### Dashboard Kab/Kota `/dashboard/kabupaten`
List pendaftar active wilayah, monitoring kuota per sekolah, statistik jalur, pengaduan kategori.

### Dashboard Sekolah `/dashboard/sekolah`
List pendaftar yang memilih sekolah ini: nama, NISN, jalur, status verifikasi. Aksi verifikator: lihat detail, setujui, tolak, minta perbaikan, catatan.

### Admin `/admin`
- **Jalur**: toggle aktif/nonaktif per jalur dari dashboard.
- **Sekolah/Kuota**: daftar sekolah, kuota terisi/tersisa, edit kuota (in-memory).
- **Seleksi**: tombol "Jalankan Seleksi Otomatis" → hasil dihitung lalu distribusi ke `/hasil`.
- **Verifikasi**: kelola status verifikasi (sample).
- **Pengaduan**: daftar tiket + status.
- **Laporan**: ringkasan + export placeholder (CSV/PDF disabled atau generate text).
- **Tombol Reset/Reseed** data mock (standar untuk demo live).

## 5. Logika Murni (pure functions) — wajib dites

### `lib/lookup.ts`
- `lookupPeserta(nisn: string): Peserta | undefined` — dari mock DB.
- `verifikasiNisn(nisn)`: status — `valid` / `tidak_ditemukan`.
- Representasi status global data: Terverifikasi / Belum Terverifikasi / Perlu Perbaikan / Tidak Ditemukan / Tidak Sesuai.

### `lib/validasi.ts`
- `validasiPersyaratanPeserta(peserta, jalur): { pass: boolean, masalah: string[] }` — aturan jalur (mis. Domisili → alamat terdaftar; Prestasi → sertifikat; Affirmasi → dokumen pendukung).
- `cekKuota(sekolah, jalur): boolean`.

### `lib/seleksi.ts`
- `jalankanSeleksi(pendaftar, sekolahKuota): HasilSeleksi[]` — algoritma: prioritas → parameter jalur → nilai/prestasi → jarak → lainnya. Deterministik, terurut. Keluaran: diterima / menunggu / tidak diterima per pendaftar.

### `lib/format.ts`
- `maskNIK(nik)` → `3215******1234`.
- `formatAngka`, `formatTanggalIndonesia`.

## 6. Mock Data

- **Peserta**: ~10–15 contoh per NISN; beragam status (ada NISN valid, ada yang data tidak sesuai, ada satu tidak ditemukan). Data sesuai struktur proposal (identitas, alamat, orang tua/wali, pendidikan).
- **Sekolah**: ~10 sekolah tersebar beberapa kab/kota Jabar; NPSN, alamat, kuota per jalur, koordinat (untuk jarak/peta).
- **Jalur**: Domisili, Afirmasi, Prestasi, Mutasi dengan konfigurasi kuota %.
- Contoh NISN demo ditampilkan di halaman cek data agar tester tahu apa yang valid.

## 7. Keamanan & Tampilan Data (sesuai proposal)

- **Data masking**: NIK dimask (hanya tampil beberapa digit).
- RBAC tampilan: dashboard provinsi → agregat; kab/kota → wilayanya; sekolah → sekolahnya; masyarakat → datanya sendiri. Dijalankan sebagai mode/peran demo sederhana (tanpa auth nyata).
- Label status data jelas di UI.

## 8. Error Handling / Edge Cases (UI)

- NISN tidak ditemukan → pesan ramah + saran hubungi pengaduan.
- OTP salah / kadaluarsa → error inline; OTP mock bisa diisi ulang.
- Kuota penuh → blok pilih sekolah, info "kuota habis".
- Duplikasi pendaftaran → cegah + pesan.
- Data belum diverifikasi → banner peringatan sebelum lanjut.
- Reset semua state → tombol di admin.

## 9. Testing

1 file `vitest` minimal di `lib/*.test.ts`: seleksi engine (urut prioritas, kuota penuh), validasi jalur (lulus/gagal + masalah), lookup NISN (valid/tidak ditemukan), masking NIK. Tidak ada framework tambahan.

## 10. Cara Menjalankan

- Dev: `npm install && npm run dev` → `http://localhost:3000`.
- Build static (opsional): `npm run build && npm run start` atau export.

## 11. Roadmap Lebih Lanjut (bukan bagian prototype ini)

- Integrasi nyata: Dapodik/PDDikti, Dukcapil, OTP gateway (SMS/WhatsApp), audit log server.
- Backend + DB (PostgreSQL), autentikasi nyata RBAC, API Gateway.
- Mobile-native (React Native/Flutter).