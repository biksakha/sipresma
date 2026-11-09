import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  Check,
  CalendarDays,
  ShieldCheck,
  Calendar,
  Layers,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  CheckCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { SchoolCalendarDate } from '../../types';
import { AcademicYearManagement } from './AcademicYearManagement';

interface Props {
  onYearChanged?: () => void;
}

export const AppSettings: React.FC<Props> = ({ onYearChanged }) => {
  const [activeSubTab, setActiveSubTab] = useState<'academic_years' | 'database' | 'calendar'>('academic_years');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [calendar, setCalendar] = useState<SchoolCalendarDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [status, cal] = await Promise.all([api.getDatabaseStatus(), api.getCalendar()]);
      setDbStatus(status);
      setCalendar(cal);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadBackup = async () => {
    try {
      const json = await api.exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cadangan_sipresma_man4kediri_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Berkas cadangan database JSON berhasil diunduh.');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengunduh cadangan database.');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await api.importDatabaseBackup(text);
        showToast('success', res.message);
        fetchData();
        onYearChanged?.();
      } catch (err: any) {
        showToast('error', err.message || 'Gagal memulihkan database.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = async () => {
    try {
      const res = await api.resetToDefault();
      showToast('success', res.message);
      setIsResetConfirmOpen(false);
      fetchData();
      onYearChanged?.();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mereset database.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold shadow-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
              : 'bg-rose-50 text-rose-800 ring-1 ring-rose-300'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Pengaturan Aplikasi & Konfigurasi Sistem
        </h1>
        <p className="text-xs text-slate-500">
          Kelola tahun ajaran akademik, status database Vercel & GitHub, dan kalender belajar madrasah.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-xl max-w-fit">
        <button
          type="button"
          onClick={() => setActiveSubTab('academic_years')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === 'academic_years'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Tahun Ajaran</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === 'database'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Database & Vercel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === 'calendar'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Kalender Belajar</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACADEMIC YEARS */}
      {activeSubTab === 'academic_years' && (
        <AcademicYearManagement onYearChanged={onYearChanged} />
      )}

      {/* SUB-TAB 2: DATABASE & VERCEL STATUS */}
      {activeSubTab === 'database' && (
        <div className="space-y-5">
          {/* Vercel & Standalone Connection Info Card */}
          <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-amber-300 shadow-xs">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sistem Terhubung ke Vercel App & GitHub
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold">
                    Status: Aktif · 100% Bebas Kuota / Tanpa Batas Harian
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Bebas Kuota</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Platform Hosting</div>
                <div className="font-bold text-slate-800">
                  Vercel App (vercel.app) & GitHub
                </div>
                <div className="text-[10px] text-slate-500">
                  Dikelola dengan berkas konfigurasi vercel.json resmi.
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Penyimpanan Data</div>
                <div className="font-bold text-emerald-700">
                  Database Mandiri Persisten (Local Storage)
                </div>
                <div className="text-[10px] text-slate-500">
                  Data tersimpan aman pada browser pengguna dan dapat dicadangkan kapan saja.
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Status Firebase Firestore</div>
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Diputuskan (Bebas Quota Limit)</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Tidak terkena batas kuota baca/tulis Google Cloud Firestore.
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Status Supabase</div>
                <div className="font-bold text-slate-700">
                  Diputuskan (Disconnected)
                </div>
                <div className="text-[10px] text-slate-500">
                  Tidak memerlukan koneksi atau database pihak ketiga yang membatasi.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs pt-3 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <div className="text-slate-400 text-[11px]">Siswa Aktif</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dbStatus?.counts?.students || 0}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <div className="text-slate-400 text-[11px]">Rombel Kelas</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dbStatus?.counts?.classes || 0}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <div className="text-slate-400 text-[11px]">Catatan Presensi</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dbStatus?.counts?.attendanceRecords || 0}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                <div className="text-slate-400 text-[11px]">Akun Pengguna</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dbStatus?.counts?.users || 0}</div>
              </div>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <HardDrive className="h-4 w-4 text-emerald-700" />
              <span>Cadangkan & Pulihkan Database (Backup & Restore)</span>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Anda dapat mencadangkan seluruh data madrasah (siswa, kelas, presensi, pengguna, dan pengaturan) ke dalam satu berkas format JSON, serta memulihkannya kembali kapan saja atau memindahkannya ke komputer/perangkat lain dengan mudah.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Cadangan Database (.json)</span>
              </button>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer">
                <Upload className="h-4 w-4 text-blue-700" />
                <span>Pulihkan Database (.json)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-rose-600" />
                <span>Reset ke Data Awal</span>
              </button>
            </div>
          </div>

          {/* Confirmation Modal for Reset */}
          {isResetConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
                <div className="flex items-center gap-2.5 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-bold text-sm text-slate-900">Konfirmasi Reset Database</h3>
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Apakah Anda yakin ingin mereset database kembali ke data bawaan awal madrasah? Data siswa dan presensi yang baru ditambahkan akan dikembalikan ke data sampel awal.
                </p>
                <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                  >
                    Ya, Reset Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CALENDAR */}
      {activeSubTab === 'calendar' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            <span>Kalender Hari Belajar & Libur Khusus</span>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            {calendar.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="font-bold text-slate-800">{c.description}</div>
                    <div className="text-[11px] text-slate-500">{c.calendarDate}</div>
                  </div>
                </div>
                <span className={`font-semibold ${c.isSchoolDay ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {c.isSchoolDay ? 'Hari Efektif Belajar' : 'Hari Libur / Kegiatan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
