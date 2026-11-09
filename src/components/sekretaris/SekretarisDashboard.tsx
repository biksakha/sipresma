import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Percent,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { UserProfile, AttendanceSummary } from '../../types';

interface Props {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

export const SekretarisDashboard: React.FC<Props> = ({ user, onNavigate }) => {
  const [todaySummary, setTodaySummary] = useState<AttendanceSummary | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [sudahIsiHariIni, setSudahIsiHariIni] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [daily, stuList] = await Promise.all([
          api.getDailyRecap(today),
          api.getStudents({ classId: user.assignedClassId || undefined, isActive: true }),
        ]);

        setTotalStudents(stuList.length);

        const myClass = daily.classes.find((c) => c.classId === user.assignedClassId);
        if (myClass) {
          setTodaySummary({
            hadir: myClass.hadir,
            sakit: myClass.sakit,
            izin: myClass.izin,
            alpa: myClass.alpa,
            totalTercatat: myClass.totalTercatat,
            persentase: myClass.persentase,
          });
          setSudahIsiHariIni(myClass.sudahIsiHariIni);
        }
      } catch (err) {
        console.error('Failed to load secretary dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.assignedClassId]);

  return (
    <div className="space-y-6">
      {/* Welcome & Class Header */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-800 to-teal-900 p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Portal Sekretaris Kelas
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
              Kelas {user.assignedClassName || 'Binaan'}
            </h1>
            <p className="mt-1 text-xs text-emerald-100">
              Sekretaris: <span className="font-semibold text-white">{user.fullName}</span> · MAN 4 Kediri
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('attendance_input')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-amber-300 transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Input Presensi Hari Ini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Status Banner */}
      <div
        className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-xs ${
          sudahIsiHariIni
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-300 bg-amber-50 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {sudahIsiHariIni ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          )}
          <div>
            <span>Status Presensi Hari Ini ({today}): </span>
            <span className="font-bold underline">
              {sudahIsiHariIni ? 'Sudah Diisi & Tersimpan di Database' : 'Belum Diisi'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('attendance_input')}
          className="font-bold hover:underline"
        >
          {sudahIsiHariIni ? 'Tinjau / Edit' : 'Isi Sekarang'} &rarr;
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Siswa</span>
            <Users className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="mt-1 text-[10px] text-slate-400">Aktif di kelas</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold">Hadir (H)</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800">
            {todaySummary?.hadir || 0}
          </div>
          <div className="mt-1 text-[10px] text-emerald-600">Hari ini</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold">Sakit (S)</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">
            {todaySummary?.sakit || 0}
          </div>
          <div className="mt-1 text-[10px] text-blue-600">Hari ini</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">Izin (I)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">
            {todaySummary?.izin || 0}
          </div>
          <div className="mt-1 text-[10px] text-amber-600">Hari ini</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">Alpa (A)</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-800">
            {todaySummary?.alpa || 0}
          </div>
          <div className="mt-1 text-[10px] text-rose-600">Hari ini</div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-semibold">% Kehadiran</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {todaySummary?.persentase !== null && todaySummary?.persentase !== undefined
              ? `${todaySummary.persentase}%`
              : '-'}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Hari ini</div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => onNavigate('attendance_input')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-sm">Input Presensi</div>
            <p className="text-xs text-slate-500 mt-1">
              Catat kehadiran harian kelas dengan 1-klik Tandai Semua Hadir.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-emerald-700 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('students')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-sm">Daftar Siswa Kelas</div>
            <p className="text-xs text-slate-500 mt-1">
              Lihat, tambah, atau perbarui biodata siswa di kelas Anda.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-emerald-700 shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('monthly_report')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-sm">Laporan Rekap Bulanan</div>
            <p className="text-xs text-slate-500 mt-1">
              Cetak laporan bulanan A4 dan ekspor ke lembar kerja Excel.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-emerald-700 shrink-0" />
        </button>
      </div>
    </div>
  );
};
