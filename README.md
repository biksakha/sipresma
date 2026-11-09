# SIPRESMA — Sistem Informasi Presensi Madrasah MAN 4 Kediri

Aplikasi web presensi dan rekapitulasi kehadiran siswa profesional, modern, responsif, aman, cepat, dan mudah digunakan oleh warga madrasah **MAN 4 Kediri**.

---

## 1. Fitur Utama

- **Pencatatan Kehadiran Harian**: Input presensi cepat dengan fitur *1-Klik Tandai Semua Hadir* dan penyesuaian status H (Hadir), S (Sakit), I (Izin), dan A (Alpa).
- **Multi-Role Access Control**:
  1. **ADMIN**: Manajemen penuh siswa, kelas, tahun ajaran, akun pengguna, reset password, hapus seluruh data siswa, ubah logo madrasah, audit logs, identitas pejabat madrasah, dan database.
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
- **Database Terpusat Cloud**:
  - Terhubung langsung ke Google Cloud Firebase Firestore database (`ai-studio-sipresmapresensi-839a9f3e-c993-4ff5-983b-75c7dfe22d09`).
  - Seluruh pengguna (Admin, Guru/Kesiswaan, Sekretaris) terhubung ke 1 sumber data terpusat real-time.

---

## 2. Kredensial Awal & Keamanan Pertama Kali Login

Pada inisialisasi pertama (bootstrap):
- **Username**: `man4keren`
- **Password Awal**: `1234`

> **Kebijakan Keamanan:**
> Sistem secara otomatis mewajibkan Admin untuk mengganti kata sandi awal pada saat login pertama kali. Kata sandi dienkripsi dengan PBKDF2/SHA-512 dengan salt acak dan tidak pernah disimpan dalam bentuk teks biasa.

Akun lain yang terdaftar dalam database terpusat:
- **Sekretaris X-A**: `sekretaris_xa` / `10F` (Password: `1234`)
- **Sekretaris XI-MIPA 1**: `sekretaris_xi1` / `10G` (Password: `1234`)
- **Bagian Kesiswaan**: `kesiswaan` (Password: `1234`)

---

## 3. Panduan Deploy ke Vercel (vercel.app)

Proyek ini telah dikonfigurasi secara lengkap untuk dapat di-deploy ke **Vercel** (`https://vercel.com`) hanya dalam beberapa klik menggunakan berkas `vercel.json`.

### Cara 1: Deploy melalui Dashboard Vercel (Rekomendasi)
1. Unggah/Push repositori kode ini ke akun **GitHub** atau **GitLab** Anda.
2. Buka dashboard Vercel di [https://vercel.com/new](https://vercel.com/new).
3. Pilih dan klik **Import** pada repositori SIPRESMA ini.
4. Pada halaman konfigurasi project:
   - **Framework Preset**: Pilih `Vite` (otomatis terdeteksi).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. *(Opsional)* Jika ingin mengatur Environment Variables di Vercel:
   - `VITE_FIREBASE_PROJECT_ID`: `jovial-citron-msjh2`
   - `VITE_FIREBASE_DATABASE_ID`: `ai-studio-sipresmapresensi-839a9f3e-c993-4ff5-983b-75c7dfe22d09`
   - `VITE_FIREBASE_API_KEY`: *(sesuai firebase-applet-config.json)*
   *(Catatan: Tanpa mengisi environment variables pun, Vercel sudah otomatis membaca konfigurasi terpusat dari `firebase-applet-config.json`).*
6. Klik **Deploy**.
7. Tunggu build selesai (~1 menit), dan aplikasi Anda langsung aktif di domain `https://[nama-proyek-anda].vercel.app`!

### Cara 2: Deploy melalui Vercel CLI (Terminal)
Jika Anda menggunakan Vercel CLI di komputer lokal:
```bash
# 1. Install Vercel CLI jika belum ada
npm install -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Deploy langsung ke Vercel (preview)
vercel

# 4. Deploy langsung ke production (vercel.app)
vercel --prod
```

### Konfigurasi Routing `vercel.json`
Berkas `vercel.json` sudah menyediakan routing rewrite Single Page Application (SPA):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Sehingga saat halaman di-refresh pada rute manapun di `vercel.app`, tidak akan terjadi error `404 Not Found`.

---

## 4. Menjalankan Aplikasi Secara Lokal

```bash
# Menjalankan server pengembangan
npm run dev

# Membangun aplikasi untuk produksi
npm run build

# Menjalankan server produksi lokal
npm run start
```
Aplikasi lokal dapat diakses pada `http://localhost:3000`.
