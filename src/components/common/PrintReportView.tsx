import React from 'react';
import { SchoolSettings, StudentRecapItem, AttendanceSummary } from '../../types';

interface Props {
  title: string;
  periodLabel: string;
  className?: string;
  students: StudentRecapItem[];
  summary: AttendanceSummary;
  settings: SchoolSettings;
  onClose?: () => void;
}

export const PrintReportView: React.FC<Props> = ({
  title,
  periodLabel,
  className,
  students,
  summary,
  settings,
  onClose,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="print-container bg-white text-black p-4 sm:p-8 max-w-[210mm] mx-auto min-h-screen">
      {/* Non-print control bar */}
      <div className="no-print mb-6 flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-xs font-bold text-slate-700">Mode Pratinjau Dokumen A4 Resmi</span>
          <p className="text-[11px] text-slate-500">Gunakan tombol cetak untuk mencetak atau simpan ke PDF.</p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tutup Pratinjau
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-xs"
          >
            Cetak Dokumen Sekarang (Ctrl+P)
          </button>
        </div>
      </div>

      {/* KOP RESMI MADRASAH */}
      <div className="border-b-4 border-double border-black pb-3 mb-5">
        <div className="flex items-center justify-center gap-4">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo Madrasah"
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain shrink-0"
            />
          )}
          <div className="flex-1 text-center">
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase">
              KEMENTERIAN AGAMA REPUBLIK INDONESIA
            </h3>
            <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase">
              KANTOR KEMENTERIAN AGAMA KABUPATEN KEDIRI
            </h3>
            <h1 className="text-base sm:text-xl font-black tracking-tight text-emerald-900 uppercase mt-0.5">
              {settings.schoolName}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-700 mt-0.5 italic">
              {settings.schoolAddress}
            </p>
          </div>
        </div>
      </div>

      {/* JUDUL LAPORAN */}
      <div className="text-center mb-5">
        <h2 className="text-sm sm:text-base font-bold uppercase underline">
          {title}
        </h2>
        <p className="text-xs text-slate-700 mt-1">
          Periode: <span className="font-semibold">{periodLabel}</span>
          {className ? ` · Rombongan Belajar: ${className}` : ' · Seluruh Siswa Madrasah'}
        </p>
      </div>

      {/* TABEL PRESENSI */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-black text-[11px]">
          <thead>
            <tr className="bg-slate-100 font-bold text-center">
              <th className="border border-black py-1.5 px-1 w-8">No</th>
              <th className="border border-black py-1.5 px-2 w-20">NIS</th>
              <th className="border border-black py-1.5 px-2 text-left">Nama Siswa</th>
              <th className="border border-black py-1.5 px-1 w-8">JK</th>
              <th className="border border-black py-1.5 px-2 w-20">Kelas</th>
              <th className="border border-black py-1.5 px-1.5 w-10">H</th>
              <th className="border border-black py-1.5 px-1.5 w-10">S</th>
              <th className="border border-black py-1.5 px-1.5 w-10">I</th>
              <th className="border border-black py-1.5 px-1.5 w-10">A</th>
              <th className="border border-black py-1.5 px-2 w-14">Total</th>
              <th className="border border-black py-1.5 px-2 w-14">% Hadir</th>
            </tr>
          </thead>
          <tbody>
            {students.map((stu, index) => (
              <tr key={stu.studentId} className="text-center">
                <td className="border border-black py-1 px-1">{index + 1}</td>
                <td className="border border-black py-1 px-2 font-mono font-medium">{stu.nis}</td>
                <td className="border border-black py-1 px-2 text-left font-medium">{stu.fullName}</td>
                <td className="border border-black py-1 px-1">{stu.gender}</td>
                <td className="border border-black py-1 px-2">{stu.className}</td>
                <td className="border border-black py-1 px-1.5 font-bold">{stu.hadir}</td>
                <td className="border border-black py-1 px-1.5">{stu.sakit}</td>
                <td className="border border-black py-1 px-1.5">{stu.izin}</td>
                <td className="border border-black py-1 px-1.5 font-bold text-rose-700">{stu.alpa}</td>
                <td className="border border-black py-1 px-2">{stu.totalTercatat}</td>
                <td className="border border-black py-1 px-2 font-bold">
                  {stu.persentase !== null ? `${stu.persentase}%` : '-'}
                </td>
              </tr>
            ))}

            {/* BARIS TOTAL REKAPITULASI */}
            <tr className="bg-slate-100 font-bold text-center">
              <td colSpan={5} className="border border-black py-1.5 px-2 text-right">
                TOTAL KESELURUHAN:
              </td>
              <td className="border border-black py-1.5 px-1.5">{summary.hadir}</td>
              <td className="border border-black py-1.5 px-1.5">{summary.sakit}</td>
              <td className="border border-black py-1.5 px-1.5">{summary.izin}</td>
              <td className="border border-black py-1.5 px-1.5">{summary.alpa}</td>
              <td className="border border-black py-1.5 px-2">{summary.totalTercatat}</td>
              <td className="border border-black py-1.5 px-2">
                {summary.persentase !== null ? `${summary.persentase}%` : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* KETERANGAN STATUS */}
      <div className="text-[10px] text-slate-700 mb-6 flex items-center justify-between">
        <div>
          <span className="font-bold">Keterangan:</span> H = Hadir · S = Sakit · I = Izin · A = Alpa
        </div>
        <div>
          <span>% Hadir = (Jumlah Hadir / Total Hari Tercatat) × 100%</span>
        </div>
      </div>

      {/* TANDA TANGAN RESMI */}
      <div className="text-xs mt-8">
        <div className="flex justify-end mb-2">
          <p>
            {settings.reportCity}, {currentDateFormatted}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-center pt-2">
          {/* Pejabat 1: Kepala Madrasah */}
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Madrasah</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{settings.principalName}</p>
            <p className="text-[11px]">NIP. {settings.principalNip}</p>
          </div>

          {/* Pejabat 2: Kesiswaan / Wali Kelas */}
          <div>
            <p>Petugas Penyusun,</p>
            <p className="font-bold">{settings.reportSignatoryTitle}</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{settings.studentAffairsName}</p>
            <p className="text-[11px]">NIP. {settings.studentAffairsNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
