import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/store/context";

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
        <main className="mx-auto max-w-6xl p-4">
          <AppProvider>{children}</AppProvider>
        </main>
        <footer className="bg-gov-900 text-white text-center text-sm p-4">
          © {new Date().getFullYear()} Pemerintah Provinsi Jawa Barat — SPMB Terintegrasi (Prototipe)
        </footer>
      </body>
    </html>
  );
}