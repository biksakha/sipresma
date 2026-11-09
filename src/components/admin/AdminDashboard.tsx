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
  Filter,
  ArrowUpRight,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { ClassItem } from '../../types';

interface Props {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [clsList, recap] = await Promise.all([
        api.getClasses(),
        api.getDailyRecap(date),
      ]);
      setClasses(clsList);
      setDailyData(recap);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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

  const pieData = [
    { name: 'Hadir', value: summary.hadir, color: '#059669' },
    { name: 'Sakit', value: summary.sakit, color: '#3b82f6' },
    { name: 'Izin', value: summary.izin, color: '#f59e0b' },
    { name: 'Alpa', value: summary.alpa, color: '#e11d48' },
  ].filter((d) => d.value > 0);

  const classBarData = (dailyData?.classes || []).map((c: any) => ({
    name: c.className,
    Hadir: c.hadir,
    Sakit: c.sakit,
    Izin: c.izin,
    Alpa: c.alpa,
    persentase: c.persentase || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Dashboard Utama Administrator
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring rekapitulasi kehadiran madrasah secara real-time.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
            <Calendar className="h-4 w-4 text-emerald-700" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden"
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

      {/* Primary Statistics Cards (WCAG AA Contrast, Anti-Slop, No Floating Pills) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Siswa</span>
            <GraduationCap className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {dailyData?.totalStudents || 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Terdaftar aktif</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Total Kelas</span>
            <Users className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {classes.filter((c) => c.isActive).length}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Rombel aktif</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold">Hadir (H)</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-800">
            {summary.hadir}
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 font-medium">Siswa tercatat</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold">Sakit (S)</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-800">
            {summary.sakit}
          </div>
          <div className="mt-1 text-[10px] text-blue-600 font-medium">Surat keterangan</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">Izin (I)</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">
            {summary.izin}
          </div>
          <div className="mt-1 text-[10px] text-amber-600 font-medium">Keperluan resmi</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">Alpa (A)</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-800">
            {summary.alpa}
          </div>
          <div className="mt-1 text-[10px] text-rose-600 font-medium">Tanpa keterangan</div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-semibold">% Kehadiran</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {summary.persentase !== null ? `${summary.persentase}%` : '-'}
          </div>
          <div className="mt-1 text-[10px] text-slate-300">
            {summary.totalTercatat > 0 ? `${summary.totalTercatat} siswa diabsen` : 'Belum ada data'}
          </div>
        </div>
      </div>

      {/* Alert Banner if some classes haven't submitted attendance today */}
      {dailyData?.unsubmittedClasses?.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Perhatian Kesiswaan:</span>{' '}
              <span>{dailyData.unsubmittedClasses.length} rombel belum mengisi presensi tanggal ini: </span>
              <span className="font-semibold text-amber-950">
                {dailyData.unsubmittedClasses.map((c: any) => c.className).join(', ')}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
          >
            <span>Bantu Input Presensi</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance per Class Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rekapitulasi Kehadiran Per Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Jumlah siswa Hadir, Sakit, Izin, dan Alpa per rombongan belajar.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {classBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                Belum ada data presensi pada tanggal yang dipilih.
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distribusi Status Kehadiran
            </h3>
            <p className="text-xs text-slate-500">
              Proporsi H, S, I, dan A madrasah secara keseluruhan.
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Tidak ada data pada tanggal ini.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-slate-600 font-medium">Hadir: {summary.hadir}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 font-medium">Sakit: {summary.sakit}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-medium">Izin: {summary.izin}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600"></span>
              <span className="text-slate-600 font-medium">Alpa: {summary.alpa}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
