# PRD — SPMB JABAR
## Sistem Penerimaan Murid Baru Terintegrasi Provinsi Jawa Barat

**Versi:** 1.0  
**Status:** Draft Product Requirements Document  
**Produk:** SPMB JABAR  
**Tagline:** *Satu NISN, Satu Data, Satu Layanan*  
**Platform:** Web Responsive, Mobile-ready  
**Target:** Pemerintah Provinsi Jawa Barat, Kabupaten/Kota, Sekolah, Orang Tua/Wali, Calon Murid

---

## 1. Product Overview

SPMB JABAR adalah platform digital terintegrasi untuk mengelola seluruh proses Sistem Penerimaan Murid Baru tingkat Provinsi Jawa Barat.

Sistem dirancang dengan pendekatan **NISN First**, yaitu calon murid menggunakan NISN sebagai identitas awal. Setelah NISN diverifikasi melalui kanal integrasi resmi, sistem mengambil data peserta didik yang tersedia sehingga pengguna tidak perlu memasukkan ulang seluruh biodata secara manual.

### Konsep Utama

```text
NISN
  ↓
Verifikasi
  ↓
Integrasi Data Resmi
  ↓
Data Peserta Didik
  ↓
Konfirmasi
  ↓
Lengkapi Data
  ↓
Pilih Jalur
  ↓
Pilih Sekolah
  ↓
Validasi
  ↓
Pendaftaran
  ↓
Verifikasi
  ↓
Seleksi
  ↓
Pengumuman
  ↓
Daftar Ulang
```

---

## 2. Problem Statement

Proses pendaftaran berpotensi menimbulkan:

- Penginputan data berulang.
- Kesalahan penulisan identitas.
- Perbedaan data antar dokumen.
- Data ganda.
- Proses verifikasi yang lama.
- Beban operator sekolah.
- Kesulitan monitoring pemerintah.
- Kurangnya transparansi proses.
- Kesulitan validasi data resmi.

---

## 3. Product Goals

1. Membuat platform SPMB terintegrasi tingkat Jawa Barat.
2. Mengurangi input biodata secara manual.
3. Menggunakan NISN sebagai identitas awal.
4. Mengambil data melalui sumber resmi yang berwenang.
5. Mempercepat proses pendaftaran.
6. Mempercepat proses verifikasi.
7. Mengurangi duplikasi data.
8. Meningkatkan transparansi seleksi.
9. Menyediakan monitoring terpusat.
10. Menjaga keamanan data pribadi.

---

## 4. Non-Goals

Sistem tidak dimaksudkan untuk:

- Membuka database pemerintah secara bebas.
- Menggantikan kepemilikan database instansi sumber.
- Melakukan scraping database pemerintah.
- Memberikan akses data pribadi kepada publik.
- Menentukan kebijakan seleksi secara sepihak oleh sistem.

Integrasi harus menggunakan kanal resmi dan mengikuti kewenangan pemilik data.

---

## 5. Target Users

### 5.1 Masyarakat / Orang Tua

Digunakan untuk:

- Autentikasi.
- Pendaftaran.
- Melihat data anak.
- Memilih sekolah.
- Mengunggah dokumen.
- Memantau status.
- Menerima pengumuman.
- Melakukan daftar ulang.
- Mengajukan pengaduan.

### 5.2 Calon Murid

Digunakan untuk:

- Identifikasi.
- Pemilihan jalur.
- Pemilihan sekolah.
- Monitoring hasil.

### 5.3 Operator Sekolah

Digunakan untuk:

- Monitoring pendaftar.
- Pemeriksaan dokumen.
- Verifikasi.
- Meminta perbaikan.
- Memberikan catatan.
- Monitoring seleksi.

### 5.4 Verifikator

Memiliki fungsi pemeriksaan data dan dokumen.

### 5.5 Admin Kabupaten/Kota

Mengelola wilayah kabupaten/kota masing-masing.

### 5.6 Super Admin Provinsi

Mengelola keseluruhan sistem tingkat Provinsi Jawa Barat.

---

## 6. Product Scope

Produk terdiri dari:

1. Public Portal.
2. Student/Parent Portal.
3. School Dashboard.
4. Kabupaten/Kota Dashboard.
5. Provincial Dashboard.
6. Data Integration Gateway.
7. Verification Engine.
8. Selection Engine.
9. Notification System.
10. Complaint Management.
11. Administration System.

---

## 7. Core Feature Requirements

## 7.1 NISN Authentication

### User Flow

```text
Input NISN
↓
Validasi Format
↓
Cari Data
↓
Verifikasi
↓
OTP
↓
Authentication Success
↓
Dashboard/Pendaftaran
```

### Input

- NISN.
- Nomor kontak.
- OTP.

### Requirements

| ID | Requirement |
|---|---|
| AUTH-001 | Sistem harus menerima NISN. |
| AUTH-002 | Sistem harus memvalidasi format NISN. |
| AUTH-003 | Sistem harus melakukan verifikasi NISN. |
| AUTH-004 | Sistem harus mengirim OTP. |
| AUTH-005 | Sistem harus membatasi percobaan OTP. |
| AUTH-006 | Sistem harus membuat session setelah autentikasi berhasil. |
| AUTH-007 | Sistem harus mencatat aktivitas autentikasi. |

---

## 8. Auto Student Data

Setelah NISN berhasil diverifikasi, sistem meminta data melalui **Data Integration Gateway**.

### Student Identity

- NISN.
- NIK.
- Nama.
- Nama sesuai dokumen resmi.
- Tempat lahir.
- Tanggal lahir.
- Jenis kelamin.
- Agama.
- Status peserta didik.
- Nomor KK jika diperbolehkan.

### Address

- Provinsi.
- Kabupaten/Kota.
- Kecamatan.
- Desa/Kelurahan.
- Alamat.
- RT/RW.
- Kode pos.

### Parent

- Nama ayah.
- NIK ayah.
- Nama ibu.
- NIK ibu.
- Nama wali.
- Hubungan.
- Kontak.

### Education

- Sekolah asal.
- NPSN.
- Kelas/tingkat.
- Tahun kelulusan.
- Status kelulusan.
- Data akademik yang dibutuhkan.

Data hanya ditampilkan apabila tersedia dan dapat diakses secara sah.

---

## 9. Data Confirmation

Setelah data ditemukan:

```text
DATA ANDA DITEMUKAN

Nama             : Ahmad Rizky
NISN             : XXXXXXXX
NIK              : **************
Tanggal Lahir     : XX XXXX XXXX
Jenis Kelamin     : Laki-laki
Alamat            : XXXXX
Sekolah Asal      : XXXXX

[ DATA SUDAH SESUAI ]

[ AJUKAN PERBAIKAN DATA ]
```

User tidak diperbolehkan sembarangan mengubah data yang berasal dari sumber resmi.

Jika terdapat ketidaksesuaian, user diarahkan ke mekanisme koreksi.

---

## 10. Data Status

Setiap data memiliki status:

- **Terverifikasi**
- **Belum Terverifikasi**
- **Perlu Perbaikan**
- **Tidak Ditemukan**
- **Data Tidak Sesuai**

---

## 11. Data Integration Gateway

Komponen inti sistem adalah **Data Integration Gateway**.

```text
SPMB JABAR
     ↓
API Gateway
     ↓
Data Integration Layer
     ↓
External Government System
     ↓
Verification Engine
     ↓
SPMB Database
```

Integrasi dapat menggunakan:

- REST API.
- Web Service.
- SSO.
- Token Authentication.
- OAuth 2.0.
- Mekanisme keamanan instansi.
- Encrypted communication.
- Audit log.

Sistem tidak boleh menggunakan scraping tanpa kewenangan.

---

## 12. Verification Engine

Verification Engine membandingkan data dari berbagai sumber.

### Data yang Diverifikasi

```text
NISN
NIK
Nama
Tempat Lahir
Tanggal Lahir
Jenis Kelamin
Sekolah Asal
Orang Tua/Wali
Persyaratan Jalur
```

### Result

```text
VALID
PERLU VERIFIKASI
DATA TIDAK DITEMUKAN
DATA TIDAK SESUAI
```

---

## 13. SPMB Admission Engine

Sistem harus mendukung konfigurasi jalur penerimaan.

### Jalur

- Domisili.
- Afirmasi.
- Prestasi.
- Mutasi.
- Jalur lainnya sesuai kebijakan.

Administrator dapat mengaktifkan/nonaktifkan jalur.

### Configuration

```text
Jalur
├── Status aktif
├── Periode pendaftaran
├── Persyaratan
├── Dokumen
├── Kuota
├── Parameter seleksi
├── Prioritas
└── Aturan ranking
```

---

## 14. School Selection

Calon murid dapat melihat:

- Nama sekolah.
- NPSN.
- Alamat.
- Daya tampung.
- Jumlah pendaftar.
- Kuota.
- Sisa kuota.
- Jalur.
- Persyaratan.
- Jarak.
- Status pendaftaran.

---

## 15. School Map

Sistem menyediakan peta yang dapat menampilkan:

- Lokasi rumah/domisili.
- Lokasi sekolah.
- Sekolah pilihan.
- Jarak.
- Koordinat.

---

## 16. Domisili / Zonasi Engine

Untuk jalur yang menggunakan domisili:

- Validasi wilayah.
- Perhitungan jarak.
- Radius.
- Validasi alamat.
- Pemetaan pendaftar.
- Visualisasi persebaran.

---

## 17. Selection Engine

Selection Engine menjalankan aturan seleksi yang dikonfigurasi pemerintah.

```text
Prioritas
   ↓
Parameter Jalur
   ↓
Nilai / Prestasi
   ↓
Jarak
   ↓
Parameter Lain
   ↓
Ranking
   ↓
Kuota
   ↓
Hasil Seleksi
```

Aturan seleksi harus configurable dan tidak hard-coded agar dapat mengikuti kebijakan resmi.

---

## 18. Quota Management

Setiap sekolah memiliki:

```text
School
├── Total Capacity
├── Quota per Path
├── Registered
├── Verified
├── Selected
└── Remaining Quota
```

Sistem harus mencegah pendaftaran melebihi kuota sesuai aturan yang dikonfigurasi.

---

## 19. Digital Document Management

Dokumen dapat berbeda berdasarkan jalur.

Contoh:

- KK.
- Dokumen afirmasi.
- Sertifikat prestasi.
- Surat keterangan.
- Dokumen mutasi.
- Dokumen lainnya.

### Status

```text
Belum Upload
      ↓
Menunggu Verifikasi
      ↓
Valid
      ↓
Ditolak / Perlu Perbaikan
```

---

## 20. School Verification

Operator dapat:

- Melihat pendaftar.
- Melihat data.
- Melihat dokumen.
- Menyetujui.
- Menolak.
- Meminta perbaikan.
- Memberikan catatan.

---

## 21. Notification System

### Channel

- Dashboard.
- Email.
- SMS.
- WhatsApp Gateway.

### Notification Event

```text
Registration Success
Data Verified
Document Revision
Status Changed
Selection Result
Re-registration Schedule
Important Announcement
```

---

## 22. Complaint Management System

User dapat membuat tiket pengaduan.

### Categories

- Data tidak sesuai.
- NISN tidak ditemukan.
- Masalah pendaftaran.
- Masalah sekolah.
- Dokumen.
- Seleksi.
- Sistem.
- Lainnya.

### Ticket Lifecycle

```text
Created
 ↓
Assigned
 ↓
In Progress
 ↓
Responded
 ↓
Resolved
 ↓
Closed
```

Setiap pengaduan memiliki nomor tiket, petugas, status, tanggapan, dan penyelesaian.

---

## 23. Anti-Fraud

Sistem harus menyediakan:

- OTP.
- NISN validation.
- Population data validation.
- Device fingerprint.
- Rate limiting.
- CAPTCHA.
- Audit log.
- Duplicate account detection.
- Duplicate registration detection.
- Suspicious activity monitoring.
- RBAC.

---

## 24. Security Requirements

### Authentication

- OTP.
- Session management.
- Token expiration.
- Login protection.

### Authorization

Menggunakan **Role-Based Access Control**.

```text
Provinsi
   ↓
Aggregate Jawa Barat

Kab/Kota
   ↓
Wilayah masing-masing

Sekolah
   ↓
Pendaftar sekolah

Masyarakat
   ↓
Data miliknya sendiri
```

### Data Security

- Encryption.
- TLS.
- Data masking.
- Audit logging.
- Backup.
- Vulnerability assessment.
- Penetration testing.
- Security monitoring.

Contoh masking:

```text
NIK: 3215******1234**
```

---

## 25. Dashboard Architecture

### Provincial Dashboard

KPI:

```text
TOTAL PENDAFTAR
TOTAL SEKOLAH
TOTAL KUOTA
DATA TERVERIFIKASI
PENDAFTAR HARI INI
```

Tambahan:

- Peta Jawa Barat.
- Statistik kabupaten/kota.
- Statistik jalur.
- Statistik sekolah.
- Status kuota.

### Kabupaten/Kota Dashboard

Fitur:

- Monitoring sekolah.
- Monitoring pendaftar.
- Monitoring kuota.
- Statistik jalur.
- Statistik peserta.
- Laporan.
- Validasi.
- Monitoring masalah.
- Pengaduan.

### School Dashboard

```text
Total Pendaftar
Menunggu Verifikasi
Terverifikasi
Perlu Perbaikan
Diterima
Tidak Diterima
Kuota Tersisa
```

### Public Dashboard

Masyarakat dapat melihat informasi publik:

- Daftar sekolah.
- Kuota.
- Informasi jalur.
- Jadwal.
- Pengumuman.
- Statistik agregat.

Data pribadi peserta tidak boleh ditampilkan secara publik.

---

## 26. Reporting & Analytics

### Report

- Pendaftar.
- Sekolah.
- Jalur.
- Kuota.
- Seleksi.
- Daftar ulang.
- Pengaduan.
- Verifikasi.
- Statistik kabupaten/kota.
- Statistik provinsi.

### Export

- PDF.
- Excel.
- CSV.

---

## 27. Admin Configuration

Admin harus dapat mengatur:

### Academic

- Tahun SPMB.
- Periode.
- Jadwal.

### Admission

- Jalur.
- Kuota.
- Persyaratan.
- Parameter seleksi.

### School

- Data sekolah.
- NPSN.
- Koordinat.
- Daya tampung.
- Jalur yang tersedia.

### User

- Role.
- Permission.
- Status akun.

### System

- Notification.
- Integration.
- Security.
- Audit.

---

## 28. School Data Management

Master data:

```text
Provinsi
  ↓
Kabupaten/Kota
  ↓
Kecamatan
  ↓
Sekolah
  ↓
Program/Jenjang
  ↓
Jalur
  ↓
Kuota
```

---

## 29. Architecture

```text
                    USERS
                      │
        ┌─────────────┴─────────────┐
        │                           │
   Public Portal              Admin Portal
        │                           │
        └─────────────┬─────────────┘
                      ↓
                SPMB JABAR
                      ↓
                 API GATEWAY
                      ↓
             AUTHENTICATION
                      ↓
          DATA INTEGRATION LAYER
             ↙       ↓       ↘
       Education   Population   Other
          Data        Data      Systems
             \        |        /
              ↓       ↓       ↓
             VERIFICATION ENGINE
                      ↓
                 SPMB CORE
                      ↓
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
 Admission       Selection       Document
 Engine           Engine          Engine
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                 DATABASE
                      ↓
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Province       Kab/Kota        School
   Dashboard      Dashboard      Dashboard
```

---

## 30. Suggested Technical Architecture

```text
Frontend
├── Public Web
├── Parent Portal
└── Admin Dashboard

Backend
├── Authentication Service
├── User Service
├── Student Service
├── Registration Service
├── School Service
├── Admission Service
├── Selection Service
├── Document Service
├── Complaint Service
├── Notification Service
└── Reporting Service

Integration
├── API Gateway
├── Integration Layer
├── Verification Engine
└── External Data Connectors

Infrastructure
├── Load Balancer
├── CDN
├── WAF
├── Firewall
├── Application Servers
├── Database
├── Cache
├── Object Storage
├── Backup
└── Monitoring
```

---

## 31. Database Core Entities

Minimal entity:

```text
User
Student
Parent
Address
School
Region
AdmissionPeriod
AdmissionPath
Quota
Requirement
Document
Registration
RegistrationChoice
Verification
Selection
Ranking
Announcement
ReRegistration
Notification
Complaint
AuditLog
IntegrationRequest
IntegrationResponse
```

### Relationship

```text
Student
   │
   ├── Parent
   ├── Address
   ├── Education
   │
   └── Registration
          │
          ├── Admission Path
          ├── School Choice
          ├── Documents
          ├── Verification
          └── Selection
```

---

## 32. Non-Functional Requirements

### Performance

Sistem harus mampu menangani lonjakan trafik pada:

- Pembukaan pendaftaran.
- Hari terakhir pendaftaran.
- Pengumuman.
- Daftar ulang.

### Scalability

Sistem harus dapat ditingkatkan kapasitasnya secara horizontal.

### Availability

Target SLA ditentukan pada kontrak pengadaan berdasarkan kebutuhan operasional.

### Security

Wajib mencakup:

- Encryption.
- WAF.
- Firewall.
- Audit log.
- Vulnerability assessment.
- Penetration testing.

### Backup

```text
Production Database
       ↓
Backup
       ↓
Secondary Storage
```

---

## 33. Data Governance

Sebelum production diperlukan keputusan mengenai:

1. Pemilik data.
2. Pengelola aplikasi.
3. Hak akses.
4. Data yang dapat ditampilkan.
5. Data yang dapat disimpan.
6. Retensi data.
7. Penghapusan/arsip.
8. Prosedur koreksi.
9. Audit.
10. Penanganan insiden.

---

## 34. User Journey

### Parent / Student

```text
Landing Page
      ↓
Pilih "Daftar SPMB"
      ↓
Input NISN
      ↓
OTP
      ↓
Data Ditemukan
      ↓
Konfirmasi
      ↓
Lengkapi Data
      ↓
Pilih Jalur
      ↓
Pilih Sekolah
      ↓
Upload Dokumen
      ↓
Review
      ↓
Submit
      ↓
Nomor Pendaftaran
      ↓
Verifikasi
      ↓
Seleksi
      ↓
Pengumuman
      ↓
Daftar Ulang
```

---

## 35. MVP

### Phase 1 — Core

- Authentication NISN.
- OTP.
- Student data lookup.
- Student profile.
- School master.
- Admission period.
- Admission path.
- Registration.
- School selection.
- Document upload.
- Verification.
- Dashboard dasar.

### Phase 2

- Integration gateway.
- Verification engine.
- Selection engine.
- Quota engine.
- Notification.
- Complaint system.

### Phase 3

- Provincial analytics.
- Geographic analytics.
- Fraud detection.
- Advanced reporting.
- Advanced monitoring.

### Phase 4

- Mobile application.
- Advanced analytics.
- Predictive analytics.
- Advanced operational intelligence.

---

## 36. Acceptance Criteria

### NISN

**Given** calon murid mempunyai NISN valid  
**When** NISN dimasukkan  
**Then** sistem melakukan proses verifikasi dan mencari data melalui integrasi resmi.

### Auto Data

**Given** data tersedia  
**When** verifikasi berhasil  
**Then** data peserta ditampilkan tanpa user menginput ulang biodata dasar.

### Invalid Data

**Given** data tidak ditemukan  
**When** proses lookup selesai  
**Then** sistem menampilkan status `DATA TIDAK DITEMUKAN`.

### Document

**Given** jalur membutuhkan dokumen  
**When** user belum mengunggah  
**Then** sistem mengikuti aturan kelengkapan dokumen jalur tersebut.

### Quota

**Given** kuota sekolah telah penuh  
**When** user melakukan pendaftaran  
**Then** sistem mengikuti aturan kuota yang telah dikonfigurasi.

### Verification

**Given** operator memeriksa dokumen  
**When** dokumen valid  
**Then** status berubah menjadi `VALID`.

### Audit

**Given** administrator mengubah data penting  
**When** perubahan dilakukan  
**Then** aktivitas dicatat dalam audit log.

---

## 37. Success Metrics

| KPI | Target Konsep |
|---|---|
| Input manual | Turun signifikan |
| Duplikasi data | Turun |
| Kesalahan administrasi | Turun |
| Waktu pendaftaran | Lebih cepat |
| Waktu verifikasi | Lebih cepat |
| Kepuasan masyarakat | Meningkat |
| Efisiensi operator | Meningkat |
| Monitoring | Terpusat |
| Statistik | Tersedia |
| Security incident | Tidak terjadi akibat kelemahan sistem |

---

## 38. Deliverables

Vendor/pengembang diharapkan menyerahkan:

1. SPMB JABAR Web Application.
2. Public Portal.
3. Parent/Student Portal.
4. School Dashboard.
5. Kabupaten/Kota Dashboard.
6. Provincial Dashboard.
7. API Gateway.
8. Data Integration Layer.
9. Verification Engine.
10. Selection Engine.
11. Announcement System.
12. Re-registration System.
13. Complaint System.
14. Notification System.
15. Security System.
16. Source code sesuai skema kepemilikan kontrak.
17. Production infrastructure.
18. Technical documentation.
19. User documentation.
20. Administrator documentation.
21. Training.
22. Maintenance.
23. Technical support.

---

## 39. Development Roadmap

```text
PHASE 01
Discovery & Analysis
        ↓
PHASE 02
UI/UX & Architecture
        ↓
PHASE 03
Core Platform
        ↓
PHASE 04
Data Integration
        ↓
PHASE 05
SPMB Engine
        ↓
PHASE 06
Security & Testing
        ↓
PHASE 07
Pilot Project
        ↓
PHASE 08
Provincial Rollout
        ↓
PHASE 09
Maintenance & Improvement
```

---

## 40. Development Priority

| Priority | Modul |
|---|---|
| **P0** | NISN Authentication |
| **P0** | Student Data Integration |
| **P0** | Registration |
| **P0** | School Master |
| **P0** | Admission Path |
| **P0** | Document |
| **P0** | Verification |
| **P0** | Quota |
| **P0** | Selection |
| **P0** | Security |
| **P1** | Notification |
| **P1** | Complaint |
| **P1** | Provincial Dashboard |
| **P1** | Kabupaten/Kota Dashboard |
| **P1** | School Dashboard |
| **P1** | Reporting |
| **P2** | Mobile App |
| **P2** | Advanced Analytics |
| **P2** | Advanced Fraud Detection |

---

## 41. Product Principles

Seluruh produk harus berpegang pada enam prinsip:

> **NISN First** — identitas dimulai dari NISN.  
> **One Data** — data tidak diinput berulang.  
> **Official Integration** — data diperoleh melalui kanal resmi.  
> **Privacy First** — data pribadi hanya dapat diakses sesuai kewenangan.  
> **Transparent Selection** — proses seleksi dapat diaudit.  
> **Centralized Monitoring** — pemerintah memiliki visibilitas terpusat.

---

## 42. Final Product Vision

SPMB JABAR diarahkan menjadi platform penerimaan murid baru tingkat provinsi yang:

- Terintegrasi.
- Berbasis data resmi.
- Minim input manual.
- Aman.
- Transparan.
- Terukur.
- Scalable.
- Mudah digunakan masyarakat.
- Efisien bagi sekolah.
- Memberikan monitoring terpusat bagi pemerintah.

Konsep utamanya adalah:

```text
                    SATU NISN
                       │
                       ↓
                   SATU DATA
                       │
                       ↓
                  SATU LAYANAN
                       │
                       ↓
                 SPMB JAWA BARAT
```

**End of PRD — SPMB JABAR v1.0**
