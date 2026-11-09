# Panduan Konfigurasi Supabase & Deployment SIPRESMA MAN 4 Kediri

Dokumen ini berisi petunjuk lengkap untuk menghubungkan aplikasi **SIPRESMA (Sistem Informasi Presensi Madrasah MAN 4 Kediri)** ke database Supabase PostgreSQL, menjalankan migrasi database, dan mengaktifkan Row Level Security (RLS).

---

## 1. Persiapan Proyek Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (*New Project*).
2. Tentukan nama proyek, misalnya: `sipresma-man4kediri`.
3. Masukkan kata sandi database yang aman dan pilih wilayah server (misal: *Singapore / Southeast Asia*).
4. Tunggu beberapa saat hingga proses pembuatan database selesai.

---

## 2. Menjalankan Skrip Migrasi SQL

1. Di dashboard Supabase, buka menu **SQL Editor** pada sidebar kiri.
2. Klik **New Query**.
3. Buka berkas `supabase/migrations/01_initial_schema.sql` pada proyek ini, salin seluruh kodenya, lalu tempelkan ke SQL Editor.
4. Klik tombol **Run** (atau tekan `Ctrl+Enter` / `Cmd+Enter`).
5. Pastikan semua tabel, enum, foreign key, index, dan kebijakan RLS (Row Level Security) berhasil dibuat tanpa kesalahan:
   - `profiles`
   - `classes`
   - `students`
   - `attendance`
   - `academic_years`
   - `semesters`
   - `school_settings`
   - `school_calendar`
   - `audit_logs`

---

## 3. Konfigurasi Kunci Akses (Environment Variables)

1. Buka menu **Project Settings** > **API** di Supabase.
2. Salin data berikut:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (hanya untuk server backend)
3. Buat berkas `.env` di direktori utama aplikasi (merujuk ke `.env.example`):

```bash
# URL Aplikasi
APP_URL="https://your-domain.app"

# Kunci Supabase
VITE_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Akun Awal & Instalasi Pertama (Bootstrap)

Saat aplikasi pertama kali dijalankan:
- **Username Admin**: `man4keren`
- **Password Awal**: `1234`

> **Penting:**
> Sistem secara otomatis mewajibkan Admin untuk mengganti password awal pada saat pertama kali login. Jangan gunakan password bawaan di lingkungan produksi!

---

## 5. Mode Penyimpanan Aplikasi

SIPRESMA mendukung 2 mode penyimpanan:
1. **Mode Supabase PostgreSQL**: Terhubung langsung ke database cloud Supabase dengan Row Level Security aktif.
2. **Mode Server Persisten Mandiri**: Menyimpan data secara persisten di berkas database server (`data/sipresma_db.json`) dengan validasi otorisasi peran backend yang lengkap, sehingga aplikasi tetap berfungsi penuh 100% tanpa konfigurasi eksternal saat evaluasi awal.

Anda dapat memantau status koneksi kapan saja melalui menu **Pengaturan Aplikasi** di akun Admin.
