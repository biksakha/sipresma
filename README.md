# SIPRESMA — Sistem Informasi Presensi Madrasah MAN 4 Kediri

Aplikasi web presensi dan rekapitulasi kehadiran siswa profesional, modern, responsif, aman, cepat, dan mudah digunakan oleh warga madrasah **MAN 4 Kediri**.

---

## 1. Fitur Utama

- **Pencatatan Kehadiran Harian**: Input presensi cepat dengan fitur *1-Klik Tandai Semua Hadir* dan penyesuaian status H (Hadir), S (Sakit), I (Izin), dan A (Alpa).
- **Multi-Role Access Control**:
  1. **ADMIN**: Manajemen penuh siswa, kelas, akun pengguna, reset password, audit logs, identitas pejabat madrasah, dan database.
  2. **SEKRETARIS**: Akses khusus untuk rombel binaannya (input presensi, riwayat, laporan bulanan, tambah/impor siswa kelas).
  3. **KESISWAAN**: Monitoring seluruh madrasah, peringatan kelas yang belum mengisi presensi, peringkat kehadiran rombel, dan rekapitulasi lengkap.
- **Perhitungan Akurat Sesuai Regulasi Madrasah**:
  - `H` = Hadir, `S` = Sakit, `I` = Izin, `A` = Alpa
  - `Jumlah hari tercatat = H + S + I + A`
  - `Persentase kehadiran = (H / Jumlah hari tercatat) × 100%`
  - Hari libur / tanpa presensi tidak dihitung alpa.
- **Ekspor Dokumen Nyata**:
  - **Excel (.xlsx)**: Spreadsheet terstruktur rapi dengan SheetJS.
  - **Word (.docx)**: Dokumen Microsoft Word dengan kop resmi Kementerian Agama dan tabel presensi yang dapat diedit.
  - **Cetak A4**: Format cetak standar kertas A4 dilengkapi Kop Madrasah resmi dan tanda tangan Kepala Madrasah serta Waka Kesiswaan.
- **Impor Siswa Massal**:
  - Unduh template Excel kosong (.xlsx).
  - Validasi duplikasi NIS dan kolom wajib.
  - Pratinjau data sebelum disimpan ke database.

---

## 2. Kredensial Awal & Keamanan Pertama Kali Login

Pada inisialisasi pertama (bootstrap):
- **Username**: `man4keren`
- **Password Awal**: `1234`

> **Kebijakan Keamanan:**
> Sistem secara otomatis mewajibkan Admin untuk mengganti kata sandi awal pada saat login pertama kali. Kata sandi dienkripsi dengan PBKDF2/SHA-512 dengan salt acak dan tidak pernah disimpan dalam bentuk teks biasa.

Tersedia pula akun uji coba untuk evaluasi peran:
- **Sekretaris X-A**: `sekretaris_xa` (Password: `1234`)
- **Sekretaris XI-MIPA 1**: `sekretaris_xi1` (Password: `1234`)
- **Bagian Kesiswaan**: `kesiswaan` (Password: `1234`)

---

## 3. Konfigurasi Supabase PostgreSQL & RLS

Aplikasi telah dilengkapi skema SQL migrasi lengkap dengan Row Level Security (RLS) di `supabase/migrations/01_initial_schema.sql`.

### Langkah Konfigurasi Supabase:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka menu **SQL Editor**, salin isi berkas `supabase/migrations/01_initial_schema.sql`, dan klik **Run**.
3. Tambahkan environment variables ke file `.env`:
   ```bash
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
4. Jika variabel Supabase belum diisi, aplikasi tetap beroperasi secara persisten penuh menggunakan database server lokal (`data/sipresma_db.json`).

---

## 4. Struktur Database

Tabel PostgreSQL / Supabase:
1. `profiles`: Profil akun pengguna, peran, status aktif, dan hash password.
2. `classes`: Rombongan belajar (X, XI, XII), tahun ajaran, dan sekretaris.
3. `students`: Biodata siswa (NIS, NISN, Nama, JK, Kelas, Status Aktif).
4. `attendance`: Catatan presensi harian per siswa dengan unique constraint `(student_id, attendance_date)`.
5. `academic_years`: Tahun ajaran.
6. `semesters`: Semester ganjil dan genap.
7. `school_settings`: Identitas madrasah, alamat, kepala madrasah, pejabat kesiswaan, kota penerbitan.
8. `school_calendar`: Kalender hari efektif belajar dan libur kegiatan.
9. `audit_logs`: Pencatatan jejak audit sistem.

---

## 5. Menjalankan Aplikasi

```bash
# Menjalankan server pengembangan
npm run dev

# Membangun aplikasi untuk produksi
npm run build

# Menjalankan server produksi
npm run start
```
Aplikasi dapat diakses pada `http://localhost:3000`.
