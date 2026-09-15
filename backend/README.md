# SPMB JABAR — Sistem Penerimaan Murid Baru Terintegrasi Jawa Barat

Portal pendaftaran murid baru terintegrasi Provinsi Jawa Barat. Laravel 12 + React
(Inertia) + PostgreSQL 16, menerapkan **Jabar Civic Portal** design system.

## Prasyarat

- PHP ≥ 8.2 (dengan `pdo_pgsql`)
- Composer 2
- Node ≥ 20 + npm
- PostgreSQL 16 (portable atau native)

## Menjalankan

### 1. PostgreSQL (portable)

Mulai server portable (jika belum jalan):

```bash
infra/pg/pgsql/bin/pg_ctl -D infra/pg/data -l infra/pg/server.log -o "-p 5433" start
```

Berhenti:

```bash
infra/pg/pgsql/bin/pg_ctl -D infra/pg/data stop
```

### 2. Backend

```bash
cd backend
composer install
npm install
cp .env.example .env        # lalu sesuaikan kredensial DB (lihat .env contoh)
php artisan key:generate
php artisan migrate:fresh --seed
npm run build               # atau: npm run dev untuk hot reload
php artisan serve           # http://localhost:8000
```

`php artisan migrate:fresh --seed` memuat: wilayah (Jabar + 6 kabkota), 6 sekolah
SMPN, 4 jalur pendaftaran + kuota, 6 peserta mock (NISN), 4 akun staf.

### 3. Kredensial demo

| Peran | Email | Kata sandi | Akses |
|---|---|---|---|
| Pendaftar (peserta) | — (login via NISN + OTP) | — | `/dashboard` |
| Operator SMPN 1 Bandung | `operator.smpn1@spmb.jabar` | `password` | `/verifikasi` |
| Admin Kabupaten Bandung | `admin.kab@spmb.jabar` | `password` | `/admin` |
| Admin Provinsi | `admin.provinsi@spmb.jabar` | `password` | `/admin` |
| Verifikator | `verifikator@spmb.jabar` | `password` | `/verifikasi` |

NISN peserta mock: `0069031234`, `0075123456`, `0082345678`, `0098765432`,
`0101234567`, `0113456789`.

**Login pendaftar (fase mock):** kode OTP tidak dikirim via SMS melainkan ditulis
ke `backend/storage/logs/laravel.log` (baris `OTP untuk NISN ... kode=...`).

### 4. Tes

```bash
cd backend
./vendor/bin/pest
```

Suite memakai DB Postgres `spmb_jabar_test` (migrasi + seeder otomatis).

## Arsitektur

```
app/Http/Controllers   — lapisan HTTP tipis
app/Services           — domain: AuthFlow, RegistrationFlow, VerificationFlow,
                         QuotaService, DocumentService, ComplaintService,
                         DashboardService
app/Integration        — DataIntegrationGateway (kontrak) + Adapters/MockAdapter
app/Models             — Eloquent untuk semua entitas
app/Support            — Audit (log jejak) & Masking (NIK/NISN)
app/Policies           — (diwakili middleware role + pemeriksaan ruang lingkup)
database/migrations    — skema semua entitas
database/seeders       — referensi + data mock
resources/js/Pages     — React (Inertia) mengikuti design system Jabar Civic Portal
```

Keputusan arsitektur selengkapnya: `docs/superpowers/specs/2026-09-14-spmb-jabar-production-design.md`.

## Alur inti

1. **NISN → OTP → sesi** — `POST /auth/nisn` (gateway) → `POST /auth/otp/send`
   → `POST /auth/otp/verify`. OTP di-hash, terbatas percobaan, kedaluwarsa,
   di-audit.
2. **Pendaftaran** — pilih jalur → pilih sekolah (prioritas 1–5) → upload
   dokumen → review → submit. Kuota dicadangkan atomik saat submit (`QuotaService`).
3. **Verifikasi** — `operator_sekolah` menunda registrasi yang mengajukan ke
   sekolahnya; keputusan di-audit.
4. **Dashboard** — pendaftar, operator, admin kabkota, admin provinsi.
5. **Pengaduan** — tiket unik (`ticket_no`), alur `dibuat → diproses → selesai`.