# SPMB JABAR

Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat — backend Laravel 12
+ React (Inertia) + PostgreSQL 16, menerapkan **Jabar Civic Portal** design system.

## Struktur

- `backend/` — aplikasi Laravel 12. Cara menjalankan, kredensial demo, arsitektur,
  alur inti: lihat [`backend/README.md`](backend/README.md).
- `docs/` — [spesifikasi desain](docs/superpowers/specs/2026-09-15-spmb-jabar-phase2-engines-design.md).

## Prasyarat

PHP ≥ 8.2 (pdo_pgsql), Composer 2, Node ≥ 20, PostgreSQL 16 (port 5433).

## Yang belum selesai

Diperbarui 2026-09-24. Bukan daftar harapan — semuanya sengaja ditunda, dengan
alasannya.

### Verifikasi

| Item | Status |
|---|---|
| 7 dari 9 halaman AppLayout dirender di browser | selesai — headless Edge + sesi login asli |
| Rombak UI (18+ halaman, desain hijau Jabar) | selesai — build hijau; verifikasi visual browser masih perlu |
| Dashboard Pendaftar + wizard `/pendaftaran` di browser | belum — butuh akun role `pendaftar`; belum ada seed, akun dibuat lewat alur NISN → OTP |
| `php artisan test` | 68 lulus / 230 assertion — CI GitHub Actions (PostgreSQL 16), PHPStan level 6 + baseline, Pint |

### Menjalankan

- PostgreSQL dev (port 5433) tidak jalan sendiri. Instance PG 18 sistem memakai
  5432, sehingga server bundled harus dijalankan dengan port eksplisit:
  `infra/pg/pgsql/bin/pg_ctl -D infra/pg/data -l infra/pg/server.log -o "-p 5433" start`

### Integrasi dengan sistem luar

- Gateway data siswa masih `MockAdapter` (baca `students` dari DB lokal).
  Kontrak `DataIntegrationGateway` sudah ada, tapi adapter nyata
  (Dapodik/PDSPK/Sudati/Disdukcapil) belum dibuat — butuh kredensial instansi.
- Jarak domisili masih sinyal mock (`jarak_domisili_km` dari seeder), belum
  dihitung dari geolokasi. Zonasi/geocoding menyusul.
- Belum ada API Gateway terpisah untuk konsumen luar — `routes/api.php` masih
  stub (`api/user`). Klien satu-satunya saat ini SPA Inertia.

### Notifikasi & penyimpanan

- Kanal notifikasi baru `DatabaseChannel` + `LogChannel`. Email belum jalan
  (`MAIL_MAILER=log`) dan WhatsApp belum ada.
- Dokumen pendaftaran disimpan di disk lokal (`FILESYSTEM_DISK=local`), belum
  object storage seperti S3.
- Broadcast pengumuman dan jadwal daftar ulang belum dikirim karena alurnya
  belum ada — bukan sekadar lupa memanggil.

### Operasional

- CI GitHub Actions sudah ada (`.github/workflows/ci.yml`): Pest + PostgreSQL 16,
  `npm run build`, Pint, dan PHPStan level 6 (dengan baseline). Dockerfile /
  `docker-compose` masih sengaja ditunda sampai runtime produksi ditentukan.
- Temuan review tingkat MINOR pada `SelectionEngine` belum ditindak.

### Fase berikutnya

Per `docs/superpowers/specs/`, ini di luar cakupan Fase 1–2: deteksi
kecurangan, analitik provinsi/geografis, dan pelaporan lanjutan.
