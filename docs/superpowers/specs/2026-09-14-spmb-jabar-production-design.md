# SPMB JABAR — Production Foundation + Phase 1 Core — Design

**Date:** 2026-09-14
**Status:** Approved for implementation
**Product:** SPMB JABAR — Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat
**Source:** `PRD_SPMB_JABAR.md` v1.0, Stitch "Jabar Civic Portal" design system (in `stitch-exports/design-system.json`)

## 1. Decisions

| Decision | Choice |
|---|---|
| Stack | Laravel 12 + React (via Inertia) |
| Database | Portable PostgreSQL 16.9 (manual, no installer), port 5433 |
| Runtime now | Native local (artisan serve + Vite) |
| Runtime later | Docker Compose (defer) |
| Scope | Production-grade foundation + Phase 1 core (PRD §35 Phase 1 + P0 items §40) |
| Student data | Data Integration Gateway as a real service, backed by a mock adapter (seeded realistic records); real gov endpoints swap in behind the same adapter interface |
| UI | Match Stitch "Jabar Civic Portal" system: emerald `#0D5C3A`, teal accent `#10B981`, Plus Jakarta Sans, rounded-8, slate neutrals |
| Language | Indonesian UI (PRD is in Indonesian; product targets Warga Jabar) |

## 2. Architecture

Laravel 12 + Inertia.js server-driven React. Laravel owns all state transitions via
services; React is thin and reads/writes through Inertia requests. This is the
canonical Laravel+React shape and gives Phase 1 velocity. The PRD's "API Gateway"
is deferred until external consumers exist — a design decision recorded at
[Notes / Non-Goals].

Domain layers:

```
app/Http/Controllers   — thin HTTP layer, calls services
app/Services           — domain logic: AuthFlow, RegistrationFlow,
                         VerificationFlow, QuotaService, SelectionService,
                         DocumentService, ComplaintService
app/Integration        — DataIntegrationGateway (contract)
                         └─ Adapters/MockAdapter (seeded records)
app/Models             — Eloquent, all domain entities
app/Policies           — RBAC enforcement point
database/migrations    — schema for §5 entities
database/seeders       — regions, schools, jalur, kuota, mock student records
```

RBAC roles (PRD §24): `admin_provinsi`, `admin_kabkota`, `verifikator`,
`operator_sekolah`, `pendaftar`. Implemented with Laravel roles column + `Policies`
+ middleware per role.

## 3. Database Core Entities (§31 of PRD)

Eager-loaded relationships modelled:

```
users (role enum, region_id)
regions (provinsi/kabkota sangkar; kecamatan, desa)
schools (npsn unique, region_id, capacity, coordinates)
admission_periods (year, registration_start/end, active)
admission_paths (code, name, active, registration period)
quotas (school_id, admission_path_id, kuota)
requirements (admission_path_id, required docs)
students (nisn unique, nik, nama, birth, sex, religion,
          status_peserta, source)
parents, addresses, education_records
registrations (student_id, admission_period_id, admission_path_id,
               primary school, status, no_pendaftaran unique)
registration_choices (registration_id, school_id, priority)
documents (registration_id, type, path, status, catatan)
verifications (registration_id, actor, status, catatan)
selections (registration_id, ranking info — Phase 1 minimal)
complaints (ticket_no unique, user, category, status, responses)
notifications (user, type, payload) — Phase 1 minimal (dashboard)
audit_logs (user, action, payload, ip, user_agent)
integration_requests / integration_responses — gateway audit
otp_codes (nisn/contact, code_hash, attempts, expires_at) — Phase 1 in-DB mock
```

Document storage: `storage/app/documents` locally; interface defined now so a
cloud object store can be swapped in later.

## 4. Core Flows (Phase 1)

### 4.1 NISN Authentication + OTP (PRD §7.1, P0)
1. `POST /auth/nisn` — validate format, rate-limit.
2. Gateway lookup via `DataIntegrationGateway::lookup(nisn)` → mock adapter
   returns student record (or `DATA_TIDAK_DITEMUKAN`).
3. `POST /auth/otp/send` — generate code, store hash, log via `AuditLog`.
4. `POST /auth/otp/verify` — bound attempts, expiry; on success create session
   as `pendaftar`, bind `student_id`.
5. Flow returns "Data Anda Ditemukan" confirmation screen (PRD §9) — data shown
   masked (PRD §24: NIK `3215******1234**`).

### 4.2 Registration (PRD §15, 17, 18)
- Confirm data → Lengkapi data (address/parent/education) editable where source
  data does not lock.
- Pilih jalur → Pilih sekolah (multi-choice priority) → Upload dokumen per jalur
  requirements → Review → Submit → `no_pendaftaran` generated.
- Quota check via `QuotaService` before each choice commit; prevents
  over-subscription (atomic lock on school row).

### 4.3 Verification (PRD §20)
- `operator_sekolah` reviews school-scoped pendaftar: docs status
  `Belum Upload → Menunggu Verifikasi → Valid / Ditolak / Perlu Perbaikan`,
  catatan, action signed via audit log.

### 4.4 Dashboards (PRD §25, basic)
- `pendaftar`: status, docs, pengumuman, bukti registrasi.
- `operator_sekolah`: KPI cards (total pendaftar, menunggu verifikasi,
  terverifikasi, kuota tersisa), list.
- `admin_kabkota`: aggregated by region.
- `admin_provinsi`: aggregated KPIs + chart.

### 4.5 Complaint (Phase 1 minimal, PRD §22)
Create ticket (categories from PRD), lifecycle `Dibuat → Diproses → Selesai`,
ticket_no unique. Read-only list + admin respond.

## 5. Security / Reliability (§23, 24, 32)

- Rate limiting on auth endpoints and OTP (Laravel `throttle`).
- OTP: hashed in DB, max attempts, expiry, logged.
- RBAC enforced via Policies + middleware.
- Data masking helper for NIK/NISN in views.
- Audit log on all state transitions (registration submit, verify, doc status).
- DB transaction + row locking on quota decrement.
- Tests: feature tests covering auth flow, registration, verification, quota
  enforcement, RBAC denial, audit log. Pest (installed in Phase 1).

## 6. Testing & Quality

- Pest + Laravel feature tests for every core flow above.
- Policies unit tested (each role × each action).
- CI: GitHub Actions `phpunit` + `npm build` (ran locally; wiring optional now).
- One runnable check per non-trivial service (assert-based).

## 7. Deliverables Checklist

- [x] Laravel 12 project scaffolded (`backend/`)
- [x] Portable Postgres 16.9 initialized + running (port 5433), db `spmb_jabar`
- [x] `.env` configured to pgsql (db `spmb_jabar`, role `spmb`, port 5433)
- [x] Dependencies: Inertia React (composer + npm), Pest
- [x] Migrations + seeders for all §3 entities
- [x] DataIntegrationGateway + MockAdapter + seed records
- [x] AuthFlow (NISN → OTP → session) + React views
- [x] RegistrationFlow + docs upload + quota (atomic)
- [x] VerificationFlow
- [x] Dashboards (pendaftar, operator, kabkota, provinsi) React
- [x] ComplaintFlow (minimal)
- [x] Audit log + masking + RBAC enforcement (middleware `role` + scope checks)
- [x] Feature tests green (25 tests, 93 assertions, Pest on Postgres `spmb_jabar_test`)
- [x] `README` run instructions (DB start script, seed, creds, test)

## Notes / Non-Goals

- API Gateway exposed as separate authenticated API surface is deferred
  (bounded in Phase 2 when external apps/agents exist). Inertia server-rendered
  SPA is the Phase 1 client.
- Real government integration (Dapodik/PDSPK/Sudati/Disdukcapil) is out of
  scope here — MockAdapter implements the contract.
- Docker Compose, object storage, WhatsApp/email notification out of band
  (documented, not built).