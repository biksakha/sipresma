import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  StudentRecapItem,
  AttendanceSummary,
  ClassItem,
  SchoolSettings,
  UserRole,
} from '../../types';
import { exportAttendanceRecapExcel } from '../../utils/excel';
import { exportAttendanceRecapWord } from '../../utils/word';
import { PrintReportView } from './PrintReportView';

interface Props {
  role: UserRole;
  assignedClassId?: string | null;
  assignedClassName?: string | null;
  defaultMode?: 'daily' | 'monthly' | 'semester' | 'yearly' | 'custom';
  activeAcademicYear?: string;
}

export const RecapView: React.FC<Props> = ({
  role,
  assignedClassId,
  assignedClassName,
  defaultMode = 'monthly',
  activeAcademicYear: propActiveYear,
}) => {
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(propActiveYear || '2025/2026');
  const [mode, setMode] = useState<'daily' | 'monthly' | 'semester' | 'yearly' | 'custom'>(
    defaultMode
  );
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    role === 'SEKRETARIS' && assignedClassId ? assignedClassId : 'all'
  );

  // Filters
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const today = new Date().toISOString().split('T')[0];
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [singleDate, setSingleDate] = useState<string>(today);
  const [startDate, setStartDate] = useState<string>('2025-07-14');
  const [endDate, setEndDate] = useState<string>(today);
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Data states
  const [students, setStudents] = useState<StudentRecapItem[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
    totalTercatat: 0,
    persentase: null,
  });
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadInitial = async () => {
    try {
      const [allClasses, schoolSettings, yearList] = await Promise.all([
        api.getClasses(),
        api.getSettings(),
        api.getAcademicYears(),
      ]);
      setClasses(allClasses);
      setSettings(schoolSettings);
      const activeObj = yearList.find((y) => y.isActive);
      if (activeObj) {
        setActiveAcademicYear(activeObj.yearName);
      } else if (propActiveYear) {
        setActiveAcademicYear(propActiveYear);
      }
    } catch (err) {
      console.error('Error loading recap options:', err);
    }
  };

  useEffect(() => {
    if (propActiveYear) setActiveAcademicYear(propActiveYear);
  }, [propActiveYear]);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadRecapData = async () => {
    setLoading(true);
    try {
      let params: any = {
        classId: selectedClassId !== 'all' ? selectedClassId : undefined,
      };

      if (mode === 'daily') {
        params.startDate = singleDate;
        params.endDate = singleDate;
      } else if (mode === 'monthly') {
        params.month = selectedMonth;
      } else if (mode === 'semester') {
        // Ganjil: July to December
        params.startDate = '2025-07-14';
        params.endDate = '2025-12-20';
      } else if (mode === 'yearly') {
        params.startDate = '2025-07-14';
        params.endDate = '2026-06-20';
      } else {
        // custom
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await api.getPeriodRecap(params);
      setStudents(res.students);
      setSummary(res.summary);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data rekapitulasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecapData();
  }, [mode, selectedClassId, selectedMonth, singleDate, startDate, endDate]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getPeriodLabel = () => {
    if (mode === 'daily') {
      return `Harian (${singleDate})`;
    }
    if (mode === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `Bulan ${monthNames[parseInt(month, 10) - 1]} ${year}`;
    }
    if (mode === 'semester') {
      return `Semester Ganjil ${activeAcademicYear}`;
    }
    if (mode === 'yearly') {
      return `Tahun Ajaran ${activeAcademicYear}`;
    }
    return `${startDate} s.d. ${endDate}`;
  };

  const selectedClassName =
    selectedClassId === 'all'
      ? 'Seluruh Kelas'
      : classes.find((c) => c.id === selectedClassId)?.className || assignedClassName || 'Kelas';

  // Export Handlers
  const handleExportExcel = () => {
    if (!settings) return;
    try {
      exportAttendanceRecapExcel({
        title: `Laporan Rekapitulasi Presensi Siswa (${getPeriodLabel()})`,
        periodLabel: getPeriodLabel(),
        className: selectedClassId !== 'all' ? selectedClassName : undefined,
        students,
        summary,
        settings,
      });
      showToast('success', 'File Excel (.xlsx) berhasil diunduh.');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengekspor file Excel.');
    }
  };

  const handleExportWord = async () => {
    if (!settings) return;
    try {
      await exportAttendanceRecapWord({
        title: `Laporan Rekapitulasi Presensi Siswa (${getPeriodLabel()})`,
        periodLabel: getPeriodLabel(),
        className: selectedClassId !== 'all' ? selectedClassName : undefined,
        students,
        summary,
        settings,
      });
      showToast('success', 'File Word (.docx) berhasil diunduh.');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengekspor file Word.');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nis.includes(searchStudent)
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
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

      {/* Header and Export Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Rekapitulasi & Laporan Kehadiran
          </h1>
          <p className="text-xs text-slate-500">
            Perhitungan rekapitulasi Hadir, Sakit, Izin, Alpa, dan persentase kehadiran nyata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Eye className="h-3.5 w-3.5 text-slate-600" />
            <span>Pratinjau Cetak</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-700" />
            <span>Cetak A4</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-800" />
            <span>Unduh Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportWord}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Unduh Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Period Tabs & Selection Controls (Segmented Control Anti-Slop) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs no-print space-y-4">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl max-w-fit">
          <button
            type="button"
            onClick={() => setMode('daily')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => setMode('monthly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setMode('semester')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'semester'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semester
          </button>
          <button
            type="button"
            onClick={() => setMode('yearly')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'yearly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahunan
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'custom'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rentang Khusus
          </button>
        </div>

        {/* Dynamic Filters depending on mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class selection (locked for secretary) */}
          {role !== 'SEKRETARIS' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Rombongan Belajar</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="all">Semua Rombel (Madrasah)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.className}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'daily' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Tanggal</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {mode === 'monthly' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Pilih Bulan & Tahun</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          )}

          {mode === 'custom' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Mulai Dari</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sampai Dengan</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </>
          )}

          {/* Quick Search Student in Recap */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Cari Siswa</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Ketik nama atau NIS..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards of Current Period */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 no-print">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-[11px] font-bold text-emerald-700">Total Hadir (H)</div>
          <div className="mt-1 text-2xl font-black text-emerald-800">{summary.hadir}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Catatan kehadiran</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="text-[11px] font-bold text-blue-700">Total Sakit (S)</div>
          <div className="mt-1 text-2xl font-black text-blue-800">{summary.sakit}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Keterangan sakit</div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="text-[11px] font-bold text-amber-700">Total Izin (I)</div>
          <div className="mt-1 text-2xl font-black text-amber-800">{summary.izin}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Izin resmi</div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="text-[11px] font-bold text-rose-700">Total Alpa (A)</div>
          <div className="mt-1 text-2xl font-black text-rose-800">{summary.alpa}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Tanpa keterangan</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold text-slate-500">Hari Tercatat</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{summary.totalTercatat}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">H + S + I + A</div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
          <div className="text-[11px] font-semibold text-slate-300">% Kehadiran</div>
          <div className="mt-1 text-2xl font-black text-amber-400">
            {summary.persentase !== null ? `${summary.persentase}%` : '-'}
          </div>
          <div className="text-[10px] text-slate-300 mt-0.5">Rata-rata periode</div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Rekapitulasi Presensi — {getPeriodLabel()}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedClassName} · Total {filteredStudents.length} siswa ditampilkan.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 w-24">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-2 text-center w-10">JK</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3 text-center w-16">Hadir (H)</th>
                <th className="py-3 px-3 text-center w-16">Sakit (S)</th>
                <th className="py-3 px-3 text-center w-16">Izin (I)</th>
                <th className="py-3 px-3 text-center w-16">Alpa (A)</th>
                <th className="py-3 px-3 text-center w-20">Total Hari</th>
                <th className="py-3 px-3 text-center w-24">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Menghitung rekapitulasi data dari database...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Tidak ada rekaman data presensi untuk periode atau pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => (
                  <tr key={stu.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{stu.nis}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{stu.fullName}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-600">{stu.gender}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-800">{stu.className}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-800">{stu.hadir}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-blue-800">{stu.sakit}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-amber-800">{stu.izin}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-700">{stu.alpa}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{stu.totalTercatat}</td>
                    <td className="py-2.5 px-3 text-center font-black text-emerald-900">
                      {stu.persentase !== null ? `${stu.persentase}%` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 my-auto">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 no-print"
            >
              <X className="h-5 w-5" />
            </button>

            <PrintReportView
              title={`LAPORAN REKAPITULASI PRESENSI SISWA`}
              periodLabel={getPeriodLabel()}
              className={selectedClassId !== 'all' ? selectedClassName : undefined}
              students={students}
              summary={summary}
              settings={settings}
              onClose={() => setIsPrintModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
