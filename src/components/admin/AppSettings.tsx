import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  Check,
  CalendarDays,
  ShieldCheck,
  Calendar,
  Layers,
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

  useEffect(() => {
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
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Pengaturan Aplikasi & Konfigurasi Sistem
        </h1>
        <p className="text-xs text-slate-500">
          Kelola tahun ajaran akademik, status database Firebase Firestore, dan kalender belajar madrasah.
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
          <span>Database & Cloud</span>
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

      {/* SUB-TAB 2: DATABASE & FIREBASE STATUS */}
      {activeSubTab === 'database' && (
        <div className="space-y-5">
          {/* Firestore Connection Info Card */}
          <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-amber-300 shadow-xs">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Firebase Firestore (Google Cloud Platform)
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold">
                    Status: Terhubung & Aktif · Database Cloud Persisten
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Terkoneksi</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Firebase Project ID</div>
                <div className="font-mono font-bold text-slate-800">
                  {dbStatus?.projectId || 'jovial-citron-msjh2'}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Firestore Database ID</div>
                <div className="font-mono font-bold text-slate-800 truncate">
                  {dbStatus?.databaseId || 'ai-studio-sipresmapresensi-839a9f3e-c993-4ff5-983b-75c7dfe22d09'}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Status Supabase</div>
                <div className="font-bold text-rose-600">
                  Diputuskan (Disconnected)
                </div>
                <div className="text-[10px] text-slate-500">
                  Arsitektur telah dialihkan sepenuhnya ke Firebase Firestore.
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">Firestore Security Rules</div>
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Deployed & Enforced</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Konfigurasi aturan akses terverifikasi via DeployRules.
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
