import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Percent,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { ClassItem, AttendanceSummary } from '../../types';

interface Props {
  onNavigate: (tab: string) => void;
}

export const KesiswaanDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dailyData, setDailyData] = useState<any>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [recap, clsList] = await Promise.all([
        api.getDailyRecap(date),
        api.getClasses(),
      ]);
      setDailyData(recap);
      setClasses(clsList);
    } catch (err) {
      console.error('Failed to load kesiswaan dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const summary = dailyData?.summary || {
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
    totalTercatat: 0,
    persentase: null,
  };

  const classList = dailyData?.classes || [];
  const unsubmitted = dailyData?.unsubmittedClasses || [];

  // Sort classes by attendance percentage
  const rankedClasses = [...classList]
    .filter((c: any) => c.persentase !== null)
    .sort((a: any, b: any) => (b.persentase || 0) - (a.persentase || 0));

  const topClasses = rankedClasses.slice(0, 3);
  const lowestClasses = [...rankedClasses].reverse().slice(0, 3);

  const chartData = classList.map((c: any) => ({
    name: c.className,
    Hadir: c.hadir,
    Sakit: c.sakit,
    Izin: c.izin,
    Alpa: c.alpa,
  }));

  return (
    <div className="space-y-6">
      {/* Title & Date Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Monitoring Presensi Bagian Kesiswaan
          </h1>
          <p className="text-xs text-slate-500">
            Pemantauan kehadiran seluruh rombel MAN 4 Kediri secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
            <Calendar className="h-4 w-4 text-emerald-700" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Siswa</span>
            <GraduationCap className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {dailyData?.totalStudents || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Seluruh madrasah</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Kelas</span>
            <Users className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {classes.filter((c) => c.isActive).length}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Rombel belajar</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold">Hadir (H)</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800">{summary.hadir}</div>
          <div className="mt-1 text-[10px] text-emerald-600 font-medium">Siswa tercatat</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold">Sakit (S)</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">{summary.sakit}</div>
          <div className="mt-1 text-[10px] text-blue-600 font-medium">Surat dokter</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">Izin (I)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">{summary.izin}</div>
          <div className="mt-1 text-[10px] text-amber-600 font-medium">Izin resmi</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">Alpa (A)</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-800">{summary.alpa}</div>
          <div className="mt-1 text-[10px] text-rose-600 font-medium">Tanpa keterangan</div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-semibold">% Kehadiran</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {summary.persentase !== null ? `${summary.persentase}%` : '-'}
          </div>
          <div className="mt-1 text-[10px] text-slate-300">Rata-rata hari ini</div>
        </div>
      </div>

      {/* CRITICAL ALERT: KELAS YANG BELUM MENGISI PRESENSI */}
      {unsubmitted.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-950">
                Peringatan: {unsubmitted.length} Kelas Belum Mengisi Presensi Hari Ini
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                Sekretaris rombel berikut belum melakukan konfirmasi presensi tanggal {selectedDate}:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {unsubmitted.map((c: any) => (
                  <span
                    key={c.classId}
                    className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300"
                  >
                    Kelas {c.className}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Rankings & Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Attendance Classes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Rombel Kehadiran Tertinggi Hari Ini
            </h3>
          </div>
          <div className="mt-3 space-y-2.5">
            {topClasses.length > 0 ? (
              topClasses.map((c: any, idx: number) => (
                <div
                  key={c.classId}
                  className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">Kelas {c.className}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.hadir} hadir dari {c.totalStudents} siswa
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-800">
                    {c.persentase}%
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Belum ada data kelas untuk diperingkat.
              </div>
            )}
          </div>
        </div>

        {/* Lowest Attendance Classes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Rombel Perlu Perhatian (Banyak Sakit / Izin / Alpa)
            </h3>
          </div>
          <div className="mt-3 space-y-2.5">
            {lowestClasses.length > 0 ? (
              lowestClasses.map((c: any, idx: number) => (
                <div
                  key={c.classId}
                  className="flex items-center justify-between rounded-xl bg-rose-50/50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-700 text-white font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">Kelas {c.className}</div>
                      <div className="text-[11px] text-slate-500">
                        S: {c.sakit} · I: {c.izin} · A: {c.alpa}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-800">
                    {c.persentase}%
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Belum ada data kelas untuk diperingkat.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Perbandingan Status Presensi Seluruh Kelas
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Statistik Hadir, Sakit, Izin, dan Alpa per rombel belajar.
        </p>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Hadir" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sakit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Izin" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alpa" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Tidak ada data presensi pada tanggal ini.
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation to Reports */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          onClick={() => onNavigate('recap_daily')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-xs">Rekapitulasi Harian</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pantau status per siswa hari ini.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-700" />
        </button>

        <button
          onClick={() => onNavigate('recap_monthly')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-xs">Rekapitulasi Bulanan</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Akumulasi H, S, I, A per siswa per bulan.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-700" />
        </button>

        <button
          onClick={() => onNavigate('print_reports')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-emerald-300 transition-colors"
        >
          <div>
            <div className="font-bold text-slate-900 text-xs">Cetak & Ekspor Dokumen</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Cetak A4, Ekspor Excel dan Word.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-700" />
        </button>
      </div>
    </div>
  );
};
