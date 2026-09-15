# SPMB JABAR — Phase 2: Verification, Selection & Notification Engines — Design

**Date:** 2026-09-15
**Status:** Approved for implementation
**Product:** SPMB JABAR — Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat
**Base:** `2026-09-14-spmb-jabar-production-design.md` (Phase 1, committed `52634c6`)
**Source:** PRD §11 (Data Integration Gateway), §12 (Verification Engine), §17 (Selection Engine), §18 (Quota), §21 (Notification System)

## 1. Decisions

| Decision | Choice |
|---|---|
| Scope | PRD §35 Phase 2: verification engine, selection engine, notification system. Quota (#18) and complaint (#22) were functionally built in Phase 1 — only exercised/kept consistent here. |
| Rule configuration | DB-configurable per path (`selection_rules`), editable by `admin_provinsi` via UI. Not hard-coded (PRD §17). |
| Selection run | Dry-run preview → publish (idempotent, re-runnable, quota-bound). |
| Verification | Field-level compare of **confirmed registration data** vs **gateway StudentRecord** (canonical). Composite verdict `VALID / DATA TIDAK SESUAI / PERLU VERIFIKASI`. | 
| Gateway | Stays `MockAdapter` (seeded students). Audit seam only (already present: `integration_requests/responses`) — no 3rd-party creds in Phase 2. |
| `selections` stub | Kept as Phase-1 history. New authoritative tables: `selection_rules`, `selection_results`. |
| Notification | Ship 4 events to a `NotificationBus` with `DatabaseChannel` (pendaftar dashboard) + `LogChannel` stub (email/SMS/WhatsApp seam, matching PRD §21 channels). |
| Drafting | React, same Jabar Civic Portal design system (emerald `#0D5C3A`, `#10B981`, Plus Jakarta Sans). |

## 2. Correction to Phase 1 design doc

Phase-1 doc §4.3/§7 claimed `selections` written by an "age-sort approximation"
(`AdminController::runSelection`). That controller is replaced by the
`SelectionEngine` in this phase. No schema bug was found in the `verified`
status filter (`VerificationFlow` maps review `valid` → registration `verified`,
which `runSelection` filters on) — it only produced empty output because no
review rows existed in test data.

## 3. Architecture

```
app/Engines/
├── VerificationEngine   — submit-time field-level compare → evidence + verdict
└── SelectionEngine      — configurable path rules → rank → quota → results
app/Services/SelectionRuleManager  — CRUD + validate rules (admin_provinsi only)
app/Support/NotificationBus        — dispatch(NotificationEvent) → channels
app/Channels/
├── DatabaseChannel      — writes notifications table (unread badge)
└── LogChannel           — writes laravel.log (seam for real email/SMS/WhatsApp)
app/Models/SelectionRule (DB config), SelectionResult
app/Support/CompositeScore  — normalization + ranking math (pure, unit-testable)
```

- **VerificationEngine** runs at `registration.submitted`. Iterates field
  comparators (NISN, NIK, nama, tempat_lahir, tanggal_lahir, jenis_kelamin,
  sekolah_asal, orang tua/wali). Each yields `PASS / FAIL / SKIP` (source
  absent). Composite: all PASS → `VALID`; any FAIL → `DATA TIDAK SESUAI`;
  otherwise → `PERLU VERIFIKASI`. Evidence JSON + verdict stored on the
  registration. This verdict is **advisory evidence for the operator** — it
  does NOT auto-transition status. Only the operator's `review()` (docs
  confirmed) sets `verified`/`rejected`/`perbaikan`, as today. Selection
  consumes `registration.status = 'verified'`. This keeps school confirmation
  authoritative while the engine surfaces mismatches.
- **SelectionEngine** consumes `registration.status = 'verified'`. Per
  school+path: compute `CompositeScore` from applied rule (normalized score,
  distance credit, tie-break), rank, then stop at quota. Per-student priority
  resolution assigns **one** school (highest priority choice that ranks within
  quota); lower-priority schools become `not_selected`. Idempotent publish.
- **NotificationBus** maps events to channels. Notification rows carry a
  `type` + `read_at`; the pendaftar dashboard renders them under "Pengumuman"
  with an unread count. Selection publish marks the result as a
  `selection_result` announcement for affected pendaftar.

## 4. Data changes (migrations)

- `students` add: `tempat_lahir` (string, nullable), `nilai_prestasi` (decimal 5,2),
  `jarak_domisili_km` (decimal 7,2) — ranking signals + verified source field.
- `registrations` add: `verification_evidence` (json, nullable) — submit-time
  engine evidence+verdict.
- `selection_rules`: `id, admission_period_id, admission_path_id, score_weight
  (decimal 5,3), distance_weight (decimal 5,3), tie_break (string enum:
  `date_submitted_asc | age_youngest`), is_active, created_by, timestamps.
  Unique: `(admission_period_id, admission_path_id)`.
- `selection_results`: `id, run_id, registration_id, school_id, admission_path_id,
  composite_score (decimal 8,4), rank, status enum(selected, not_selected),
  priority_used, timestamps`. Indexes on `(run_id)`, `(registration_id)`.
- Seeder: `SelectionRuleSeeder` — per path (zonasi distance-heavy, prestasi
  score-heavy, afirmasi/perpindahan balanced); students get seeded
  `nilai_prestasi` + `jarak_domisili_km`.

## 5. Flows

### 5.1 Verification
1. On submit, `RegistrationFlow` calls `VerificationEngine::run($registration)`.
2. Engine pulls gateway `StudentRecord` (MockAdapter), compares confirmed fields.
3. Writes advisory evidence+verdict to `registrations.verification_evidence`
   (does NOT change status).
4. Operator's existing `VerificationFlow::review` remains the status authority —
   reads evidence summary, sets `valid → verified` / `ditolak → rejected` /
   `perbaikan` + catatan; pinned to `verifications` + audit as today.
   The engine's `DATA TIDAK SESUAI` verdict surfaces in the operator queue so
   mismatches are not silently accepted.

### 5.2 Selection
1. `SelectionRuleManager` lists/edits rules (admin_provinsi UI).
2. **Dry-run**: computes ranks for all verified registrations per enabled path
   without persisting; returns a grouped preview (per school: ranked list,
   quota boundary). 
3. **Publish**: for the active period, deletes prior `selection_results` for that
   period, computes with `run_id = <new>`, persists. Generates `selection_result`
   notifications. Idempotent — re-publish recomputes.
4. Quota enforced within the engine (stop at `quota.kuota` per school+path).

### 5.3 Notification
- Events: `registration.submitted`, `registration.verified`,
  `document.revision`, `selection.published`. Dispatched from RegistrationFlow,
  VerificationFlow, DocumentService, SelectionEngine.
- `DatabaseChannel` writes a `notifications` row (unread); pendaftar dashboard
  shows "Pengumuman" + unread count. `LogChannel` writes a stub line.

## 6. UI (React, same design system)

- **Admin/Dashboard — "Seleksi" tab**: rules table per path (weights + tie-break
  editable, active toggle), "Hitung (dry-run)" → preview per school with quota
  line, "Publikasikan Hasil" → persists + notifies. Errors surfaced from
  `SelectionRuleManager` (invalid weights, no active period).
- **Pendaftar/Dashboard — "Pengumuman"**: notification list from
  DatabaseChannel (unread badge, mark-read), including selection result.

## 7. Security / reliability (unchanged principles, re-applied)

- `admin_provinsi` only for rule edit + publish (middleware `role`).
- Selection publish wraps in DB transaction; dry-run never writes.
- Audit log on: engine verification, rule update, selection publish.
- Idempotent publish prevents double-offers.

## 8. Testing

- `VerificationEngineTest` — PASS/FAIL/SKIP composite; evidence shape; verdict
  edge cases (SKIP-heavy → PERLU VERIFIKASI).
- `SelectionEngineTest` — rule application, score+distance ranking, quota stop,
  priority resolution (one school per student), dry-run persists nothing,
  publish idempotent + notifies.
- `CompositeScoreTest` — pure math: normalization, tie-break, weight=0 edge.
- `NotificationBusTest` — event → DatabaseChannel row; LogChannel writes;
  unread count.
- `AdminUiTest` — rules page renders, dry-run shows preview without persisting,
  publish persists + notifies, RBAC denial on non-admin.

## 9. Deliverables checklist

- [ ] Migrations: students columns, registrations evidence, selection_rules, selection_results
- [ ] SelectionRuleSeeder (+ students score/distance seed data)
- [ ] VerificationEngine + evidence on submit
- [ ] SelectionEngine + SelectionRuleManager + CompositeScore (pure)
- [ ] NotificationBus + DatabaseChannel + LogChannel, 4 events wired
- [ ] Admin "Seleksi" UI (rules, dry-run, publish), pendaftar "Pengumuman"
- [ ] Feature + unit tests green (Pest on Postgres)
- [ ] README run/demo notes for engines

## Notes / Non-Goals

- No real 3rd-party adapter (Dapodik/PDSPK/Sudati/Disdukcapil) — MockAdapter
  stays; gateway audit seam already exists.
- Distance is a seeded mock signal (`jarak_domisili_km`), not geo-computed —
  real geocoding/zonasi is Phase 3 (PRD §15/16).
- Fraud detection, provincial/geographic analytics, advanced reporting remain
  Phase 3.
- Re-registration schedule + general announcement broadcast not yet dispatched
  (no such flows exist — wired when those features land).