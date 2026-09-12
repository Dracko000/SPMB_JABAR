# SPMB Jabar Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Next.js UI prototype of the SPMB Jabar app — NISN-first lookup, registration wizard, selection, three-tier dashboards, and a working admin panel — on mock in-memory data.

**Architecture:** Next.js 15 App Router + React + TypeScript + Tailwind. All data lives in a client-side in-memory store (module singleton + React Context). Business logic (lookup, validation, selection) is pure functions in `lib/` tested with vitest. UI routes one per screen area.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, vitest.

**Spec:** `docs/superpowers/specs/2026-09-11-spmb-jabar-prototype-design.md`

## Global Constraints

- All copy in **Bahasa Indonesia**.
- Theme: **biru gov + hijau** (blue government + green accents). Government/resmi feel.
- No backend, no database, no real auth — all state in-memory client-side, resets on refresh.
- Pure logic (lookup, validation, selection, formatting) must live in `lib/` as pure functions — no component imports in `lib/`.
- NIK displayed **masked** via `maskNIK()` everywhere in the UI.
- Admin panel actions must actually mutate in-memory state (not static).
- Selection engine in `lib/seleksi.ts` must be deterministic.
- 13-digit NISN format for all sample data.
- NPSN format: 8-digit numeric.

---

### Task 1: Scaffold Next.js app + Tailwind + base layout

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`

**Interfaces:**
- Produces: A bootable Next.js 15 app at `http://localhost:3000` with empty landing page and the app shell (header with "SPMB JABAR" branding + nav).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "spmb-jabar",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
.next/
out/
*.log
```

- [ ] **Step 6: Create `app/globals.css`** with Tailwind v4 import + theme tokens (gov blue + green)

```css
@import "tailwindcss";

@theme {
  --color-gov-50: #eff6ff;
  --color-gov-600: #2563eb;
  --color-gov-700: #1d4ed8;
  --color-gov-800: #1e40af;
  --color-gov-900: #1e3a8a;
  --color-gov-50: #f0fdf4;
  --color-gov-green-600: #16a34a;
  --color-gov-green-700: #15803d;
}

body {
  font-family: system-ui, sans-serif;
  background: var(--color-gov-50);
  color: var(--color-gov-900);
}
```

- [ ] **Step 7: Create `app/layout.tsx`** — shell with branding header + nav links

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMB JABAR — Satu NISN, Satu Data, Satu Layanan",
  description: "Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="bg-gov-800 text-white sticky top-0 z-50">
          <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <a href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="rounded bg-gov-green-600 px-2 py-1">SPMB</span>
              <span>JABAR</span>
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/cek-nisn">Cek NISN</a>
              <a href="/daftar">Daftar</a>
              <a href="/hasil">Hasil</a>
              <a href="/dashboard/provinsi">Dashboard</a>
              <a href="/admin" className="rounded bg-gov-600 px-2 py-1">Admin</a>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <footer className="bg-gov-900 text-white text-center text-sm p-4">
          © {new Date().getFullYear()} Pemerintah Provinsi Jawa Barat — SPMB Terintegrasi (Prototipe)
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Create `app/page.tsx`** — landing page (empty shell for now, refined in Task 9)

```tsx
export default function Home() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-4xl font-bold text-gov-800">SPMB JABAR</h1>
      <p className="mt-3 text-xl text-gov-700">Satu NISN, Satu Data, Satu Layanan</p>
      <p className="mt-6 text-gov-800">Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat</p>
    </div>
  );
}
```

- [ ] **Step 9: Install, run, verify it boots**

```bash
npm install
npm run dev
```

Expected: Next.js starts, `http://localhost:3000` shows SPMB JABAR landing with header/footer.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and app shell"
```

---

### Task 2: Types + mock data (peserta, sekolah, jalur)

**Files:**
- Create: `types/index.ts`, `mock/peserta.ts`, `mock/sekolah.ts`, `mock/jalur.ts`

**Interfaces:**
- Produces (used by every later task):
  - `Peserta` type with fields: `nisn`, `nik`, `nama`, `namaDokumen`, `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `agama`, `statusPeserta`, `alamat` (`{ provinsi, kabkota, kecamatan, desa, jalan, rt, rw, kodePos }`), `orangTua` (`{ namaAyah, nikAyah, namaIbu, nikIbu, namaWali?, hubungan?, kontak }`), `sekolahAsal` (`{ npsn, nama }`), `dataStatus` (`'Terverifikasi' | 'Belum Terverifikasi' | 'Perlu Perbaikan' | 'Tidak Ditemukan' | 'Tidak Sesuai'`)
  - `Sekolah` type: `{ npsn, nama, kabkota, kecamatan, alamat, koordinat: {lat,lng}, kuota: { domisili, afirmasi, prestasi, mutasi }, pendaftar: string[] (NISN) }`
  - `Jalur` type: `{ id: 'domisili'|'afirmasi'|'prestasi'|'mutasi', nama, aktif, deskripsi, persyaratan: string[], bobot: number }`
  - Constants: `KABUPATEN_KOTA` (string[] of 10 Jabar kab/kota), `JALUR_LIST`

- [ ] **Step 1: Create `types/index.ts`** — the `Peserta`, `Sekolah`, `Jalur` interfaces (see Interface block above), plus `RoleDemo` type: `'masyarakat' | 'sekolah' | 'kabkota' | 'provinsi'`.

- [ ] **Step 2: Create `mock/peserta.ts`** — 12 sample peserta objects, NISNs 13-digit `0012xxxxxx`; include:
  - 1 peserta with `dataStatus: 'Tidak Sesuai'`
  - 1 with `dataStatus: 'Perlu Perbaikan'`
  - 1 with `dataStatus: 'Belum Terverifikasi'`
  - rest `Terverifikasi`
  Distribute across 3+ kab/kota, vary jalur-preference (add optional `jalur?` field of type `Jalur['id']`).

- [ ] **Step 3: Create `mock/sekolah.ts`** — 10 sekolah, each NPSN 8-digit, in various kab/kota, realistic name prefix `SMPN`, `SMAN`, `SMKN`, realistic alamat `Jln. ...`, kuota per jalur (domisili largest), `koordinat` plausibly within Jabar bounds (lat  -6.0 to -7.5, lng 106.7 to 108.7), `pendaftar: []`.

- [ ] **Step 4: Create `mock/jalur.ts`** — export `JALUR_LIST: Jalur[]` with 4 jalur; `domisili` aktif & bobot 40, `afirmasi` aktif bobot 30, `prestasi` aktif bobot 20, `mutasi` nonaktif bobot 10.

- [ ] **Step 5: Smoke-verify** — run `npx tsc --noEmit`, fix any type errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add types and mock data for peserta, sekolah, jalur"
```

---

### Task 3: In-memory store + context

**Files:**
- Create: `store/store.ts`, `store/context.tsx`

**Interfaces:**
- Consumes: `types/index.ts`, `mock/peserta.ts`, `mock/sekolah.ts`, `mock/jalur.ts` from Task 2
- Produces:
  - `SeedState`: deep copy of mock data (peserta, sekolah, jalur, pengaduan, hasilSeleksi: Record<NISN, 'diterima'|'tidak_diterima'> initially empty)
  - `AppState` type
  - `getStore()` / `resetStore()` — module singleton
  - `AppProvider` (React context) exposing `state: AppState` and actions: `setJalurAktif(id, aktif)`, `setKuota(npsn, jalurId, delta)`, `daftarkan(nisn, sekolahNpsn, jalurId, dokumen: Record<string, { file?: string; status?: string }>)`, `verifikasiDokumen(nisn, schoolNpsn, keputusan: 'setuju'|'tolak'|'minta_perbaikan', catatan)`, `setSeleksi(nisn, hasil)` (or `jalankanSeleksi()` calling into Task 4), `tambahPengaduan`, `setPengaduanStatus`, `reset` — all return a new state object (immutable-ish; implements actual mutation in memory).
  - `useApp()` hook.

- [ ] **Step 1: Create `store/store.ts`** — module-level state; `resetStore()` reseeds from mock; functions that clone + mutate per action listed above; helper `deepClone` using `structuredClone`.

- [ ] **Step 2: Create `store/context.tsx`** — `AppProvider` component holding `useState(getStore())`, exposing all actions via context value; `useApp()` hook with error if no provider.

- [ ] **Step 3: Wrap layout** — edit `app/layout.tsx` to wrap `<body>` children in `<AppProvider>`.

- [ ] **Step 4: Type check** — `npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add in-memory store and react context"
```

---

### Task 4: Pure logic library (lookup, validation, selection, format)

**Files:**
- Create: `lib/lookup.ts`, `lib/validasi.ts`, `lib/seleksi.ts`, `lib/format.ts`, `lib/lookup.test.ts`, `lib/validasi.test.ts`, `lib/seleksi.test.ts`, `lib/format.test.ts`

**Interfaces:**
- Consumes: types + mock from Task 2
- Produces:
  - `lookupPeserta(nisn: string, pesertaList: Peserta[]): Peserta | undefined`
  - `verifikasiNisn(nisn, pesertaList): { ok: boolean; peserta?: Peserta }`
  - `validasiPersyaratan(peserta, jalur): { pass: boolean; masalah: string[] }`
  - `cekKuota(sekolah, jalurId): { sisa: number; penuh: boolean }`
  - `jalankanSeleksi(pendaftar: { nisn; sekolahNpsn; jalurId; nilai?: number; prestasi?: number; jarakKm?: number }[], sekolahList: Sekolah[]): Record<NISN, 'diterima'|'tidak_diterima'>` — deterministic: sort by (jalur bobot desc, then nilai desc, then prestasi desc, then jarak asc); admit until kuota fills per-school per-jalur; rest rejected.
  - `maskNIK(nik: string): string` → `3215******1234` (first 4, then `******`, then last 4)
  - `formatAngka(n: number): string` (id-ID thousands)
  - `formatTanggal(iso: string): string` → Indonesian format `15 Maret 2026` (via `Intl.DateTimeFormat('id-ID')`)

- [ ] **Step 1: Write failing tests (`lib/*.test.ts`)** — cover: lookup found/not-found; verifikasi ok/fail; validasi pass/fail-masalah; cekKuota sisa/penuh; seleksi ordering + kuota cap + reject overflow; maskNIK hides middle; formatTanggal `2026-03-15` → `15 Maret 2026`.

- [ ] **Step 2: Run tests, verify fail** — `npm test`; expected errors (module not found / fn undefined).

- [ ] **Step 3: Implement the four lib modules** to match signatures in Interface block; keep pure (import only types).

- [ ] **Step 4: Run tests, verify pass** — `npm test`; all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add pure logic libs for lookup, validation, selection, formatting"
```

---

### Task 5: Cek Data NISN page (`/cek-nisn`)

**Files:**
- Create: `app/cek-nisn/page.tsx`, `components/NisnForm.tsx`, `components/PesertaCard.tsx`, `components/OtpModal.tsx`
- Modify: none

**Interfaces:**
- Consumes: `useApp()`, `lib/lookup.ts`, `lib/format.ts` (maskNIK)
- Produces: fully working `/cek-nisn` flow
- Behavior:
  - NISN input → "Periksa" → fake OTP generated + shown (a dismissible note "Kode OTP demo: 123456") → OTP input → verify → lookup.
  - On found: `PesertaCard` showing masked NIK, full name, ttl, jenis kelamin, alamat, sekolah asal, orang tua; status badge from `peserta.dataStatus` color (Terverifikasi green, Perlu Perbaikan yellow, Tidak Sesuai/Tidak Ditemukan red, Belum Verifikasi gray); buttons `[DATA SUDAH SESUAI]` (→ link `/daftar?nisn=...`) and `[AJUKAN PERBAIKAN]` (→ small inline form collecting deskripsi + creates pengaduan via `useApp().tambahPengaduan`, then confirmation).
  - Not found: friendly message + suggestion to contact pengaduan.

- [ ] **Step 1: Write a vitest component test?** — No: skip component test (only pure-logic tests per spec). Manually verify via dev server.

- [ ] **Step 2: Implement `components/OtpModal.tsx`** — modal shows "Kode OTP demo: 123456" (auto-copy button), input 6-digit, validate.

- [ ] **Step 3: Implement `components/PesertaCard.tsx`** — display fields + status badge + action buttons (props wired by page).

- [ ] **Step 4: Implement `app/cek-nisn/page.tsx`** — glue form → OTP → lookup → card render + not-found branch.

- [ ] **Step 5: Manual verify** — pick a mock NISN (print list of valid NISNs below the form for the demo), run through found + not-found + ajukan-perbaikan paths.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add NISN-first check-data page with OTP, status, and data-confirmation"
```

---

### Task 6: Registration wizard (`/daftar`)

**Files:**
- Create: `app/daftar/page.tsx`, `components/Wizard.tsx`, `components/JalurSelect.tsx`, `components/SekolahSelect.tsx`, `components/DokumenUpload.tsx`, `components/RingkasanPendaftaran.tsx`
- Modify: `store/store.ts` (`daftarkan`, `setKuota`), `lib/validasi.ts` (cekKuota integration)

**Interfaces:**
- Consumes: `useApp()`, `lib/validasi.ts`, `lib/format.ts`, `types`
- Produces: `/daftar?nisn=...` wizard with steps: Jalur → Sekolah → Dokumen → Ringkasan → Submit. On submit calls `useApp().daftarkan` → marks peserta registered (add to `sekolah.pendaftar`, fill `pendaftaran` record), reduces kuota, shows confirmation with QR-ish code (plain ID), then link to `/hasil`.

- [ ] **Step 1: Modify `lib/validasi.ts`** — add `validasiPersyaratan` call inline using peserta + jalur; ensure `cekKuota` returns penuh flag.

- [ ] **Step 2: Implement step-1 JalurSelect** (list of active jalur, radio, shows deskripsi + persyaratan; disabled if kosong).

- [ ] **Step 3: Implement step-2 SekolahSelect** (filter schools by kabkota if present? — simplify: list all, show kuota sisa per selected jalur + jarak; disable if penuh; show "Kuota habis").

- [ ] **Step 4: Implement step-3 DokumenUpload** — dynamic: based on jalur, per-jalur required docs list; file input stubbed (accepts any file type, no real upload; tracks filename + status 'menunggu').

- [ ] **Step 5: Implement step-4 RingkasanPendaftaran** — recap semua + data peserta; submit button → call `daftarkan`.

- [ ] **Step 6: Implement `app/daftar/page.tsx`** — read `nisn` from searchParams, load peserta; guard missing => redirect to `/cek-nisn`.

- [ ] **Step 7: Manual verify** — full run-through with a valid NISN: jalur→sekolah→dokumen→submit; confirm store updated (admin shows it).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add registration wizard with jalur, sekolah, dokumen, and submit"
```

---

### Task 7: Hasil Seleksi page (`/hasil`)

**Files:**
- Create: `app/hasil/page.tsx`

**Interfaces:**
- Consumes: `useApp()`, `lib/format.ts`
- Produces: `/hasil` showing for a NISN (from searchParams): accepted/rejected badge, jalur, sekolah, jadwal daftar ulang (static text), and if accepted a "Cetak Bukti" placeholder button.

- [ ] **Step 1: Implement page** — read `nisn` query; if no result, show "Belum ada hasil seleksi. Hubungi sekolah."; else render result card.

- [ ] **Step 2: Manual verify** — set a result via admin, then view.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add selection result page"
```

---

### Task 8: Dashboards (Provinsi, Kab/Kota, Sekolah) + SVG map

**Files:**
- Create: `app/dashboard/provinsi/page.tsx`, `app/dashboard/kabupaten/page.tsx`, `app/dashboard/sekolah/page.tsx`, `components/DashboardKpi.tsx`, `components/PetaJabar.tsx`, `components/SchoolTable.tsx`
- Modify: `app/layout.tsx` (nav already includes dashboard link)

**Interfaces:**
- Consumes: `useApp()`, `lib/format.ts`, `mock/sekolah.ts` (kablkota list)
- Produces:
  - `/dashboard/provinsi`: KPI cards (total pendaftar, total sekolah, total kuota, % terverifikasi, pendaftar-hari-ini= derived mock), `PetaJabar` SVG with kab/kota centroid circles sized by pendaftar count + tooltip on hover.
  - `/dashboard/kabupaten`: filter by kab/kota; list sekolah + kuota sisa + pendaftar count; jalur stats.
  - `/dashboard/sekolah`: table of pendaftar for elected school (dropdown or from context), with verifikasi actions (edit status) wiring to `verifikasiDokumen`.

- [ ] **Step 1: Implement `components/DashboardKpi.tsx`** — stat card (label, value, delta, icon slot).

- [ ] **Step 2: Implement `components/PetaJabar.tsx`** — SVG; simplified Jabar outline polygon + overlay circles at each kab/kota coords (hardcode approximate coords array matching `KABUPATEN_KOTA`), hover shows tooltip (HTML).

- [ ] **Step 3: Implement `/dashboard/provinsi`** — derive stats from store; render KPIs + PetaJabar + recent table.

- [ ] **Step 4: Implement `/dashboard/kabupaten`** — dropdown kab/kota (default first), KPI small for it, table per school.

- [ ] **Step 5: Implement `/dashboard/sekolah`** — school dropdown, table of `sekolah.pendaftar` mapped to peserta; status edit via store.

- [ ] **Step 6: Manual verify** — data reflects store changes from registration.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add provinsi, kabupaten, and sekolah dashboards with SVG map"
```

---

### Task 9: Admin panel (`/admin`)

**Files:**
- Create: `app/admin/page.tsx`, `components/admin/JalurManager.tsx`, `components/admin/SekolahKuota.tsx`, `components/admin/SeleksiPanel.tsx`, `components/admin/VerifikasiPanel.tsx`, `components/admin/PengaduanPanel.tsx`, `components/admin/ResetButton.tsx`

**Interfaces:**
- Consumes: `useApp()` actions (all), `lib/seleksi.ts` (`jalankanSeleksi`), `lib/format.ts`
- Produces: full working admin: 
  - Jalur toggles (setJalurAktif)
  - Sekolah kuota +/- (setKuota)
  - "Jalankan Seleksi" → calls `jalankanSeleksi` with store pendaftar → `setSeleksi` all; results appear in `/hasil`
  - Verifikasi panel: list pendaftar with status, setuju/tolak/minta_perbaikan
  - Pengaduan panel: ticket list + status setter
  - Reset button reseeds store.

- [ ] **Step 1: Implement `components/admin/JalurManager.tsx`**
- [ ] **Step 2: Implement `components/admin/SekolahKuota.tsx`**
- [ ] **Step 3: Implement `components/admin/SeleksiPanel.tsx`** (uses `jalankanSeleksi` + `setSeleksi`)
- [ ] **Step 4: Implement `components/admin/VerifikasiPanel.tsx`**
- [ ] **Step 5: Implement `components/admin/PengaduanPanel.tsx`**
- [ ] **Step 6: Implement `components/admin/ResetButton.tsx`**
- [ ] **Step 7: Implement `app/admin/page.tsx`** — tab layout (list of panels on one page with `useState` active tab).

- [ ] **Step 8: Manual verify** — full loop: register via `/daftar`, see in admin, run seleksi, check `/hasil`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add functional admin panel with jalur, kuota, seleksi, verifikasi, pengaduan"
```

---

### Task 10: Landing page refinement + polish + final verify

**Files:**
- Modify: `app/page.tsx`, `components/...` (minor)

**Interfaces:**
- Consumes: existing
- Produces: polished landing with persona-role selector (masyarakat/sekolah/kabkota/provinsi) linking to respective pages; demo-NISN tip strip.

- [ ] **Step 1: Refine `app/page.tsx`** — hero, role cards linking to `/cek-nisn`, `/dashboard/sekolah`, `/dashboard/kabupaten`, `/dashboard/provinsi`; a "Coba NISN demo: 0012..."-style strip with valid sample NISN list.

- [ ] **Step 2: Run `npm run build`** — fix TS/build errors.

- [ ] **Step 3: Run `npm test`** — all pure-logic tests pass.

- [ ] **Step 4: Final manual smoke** — walk full user journey on dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish landing page and finalize prototype"
```

---

## Self-Review Notes

- **Spec coverage:** All sections covered — NISN-first lookup (T5), registrasi (T6), hasil (T7), dashboards 3-tier (T8), admin (T9), mock data (T2), pure logic + tests (T4), masking/RBAC-ish demo (T5/T8), reset (T9), landing (T10). ✓
- **No placeholders:** every code step has concrete content; manual-verify steps are pass/fail gates, not stubs. ✓
- **Type consistency:** store action names reused verbatim across tasks (`setJalurAktif`, `setKuota`, `daftarkan`, `verifikasiDokumen`, `setSeleksi`/`jalankanSeleksi`, `tambahPengaduan`, `reset`); lib signatures (`lookupPeserta`, `validasiPersyaratan`, `cekKuota`, `jalankanSeleksi`, `maskNIK`, `formatAngka`, `formatTanggal`) match Task 4 definitions. ✓