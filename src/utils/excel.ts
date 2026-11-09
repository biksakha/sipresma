/**
 * Excel Utility (Import & Export) using SheetJS (xlsx)
 */
import * as XLSX from 'xlsx';
import { StudentRecapItem, AttendanceSummary, SchoolSettings } from '../types';

/**
 * Generates and downloads blank student import Excel template
 */
export function downloadStudentTemplate() {
  const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Jenis Kelamin', 'Kelas'];
  const sampleRows = [
    ['25101', '0089123401', 'Ahmad Rizki Maulana', 'L', 'X-A'],
    ['25102', '0089123402', 'Annisa Nurul Hidayati', 'P', 'X-A'],
    ['25103', '0089123403', 'Bima Sakti Pratama', 'L', 'X-A'],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 15 }, // NIS
    { wch: 18 }, // NISN
    { wch: 30 }, // Nama Lengkap
    { wch: 15 }, // Jenis Kelamin
    { wch: 15 }, // Kelas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
  XLSX.writeFile(wb, 'Template_Impor_Siswa_MAN4_Kediri.xlsx');
}

/**
 * Parses uploaded Excel / CSV file buffer or File object
 */
export async function parseUploadedStudentFile(file: File): Promise<Array<{
  nis: string;
  nisn: string;
  fullName: string;
  gender: 'L' | 'P';
  className: string;
}>> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawRows.map((row) => {
    // Check multiple possible key variations in Indonesian
    const nis = String(row['NIS'] || row['nis'] || row['Nomor Induk Siswa'] || '').trim();
    const nisn = String(row['NISN'] || row['nisn'] || '').trim();
    const fullName = String(row['Nama Lengkap'] || row['Nama'] || row['nama'] || row['full_name'] || '').trim();
    const rawGender = String(row['Jenis Kelamin'] || row['JK'] || row['L/P'] || row['gender'] || '').trim().toUpperCase();
    const gender: 'L' | 'P' = rawGender.startsWith('P') || rawGender === 'PEREMPUAN' ? 'P' : 'L';
    const className = String(row['Kelas'] || row['Rombel'] || row['kelas'] || '').trim();

    return { nis, nisn, fullName, gender, className };
  });
}

/**
 * Exports Attendance Recapitulation to Excel (.xlsx)
 */
export function exportAttendanceRecapExcel(params: {
  title: string;
  periodLabel: string;
  className?: string;
  students: StudentRecapItem[];
  summary: AttendanceSummary;
  settings: SchoolSettings;
}) {
  const { title, periodLabel, className, students, summary, settings } = params;

  // Header information
  const rows: any[][] = [
    [settings.schoolName.toUpperCase()],
    ['SISTEM INFORMASI PRESENSI MADRASAH (SIPRESMA)'],
    [title.toUpperCase()],
    [`Periode: ${periodLabel}${className ? ` | Kelas: ${className}` : ''}`],
    [''], // blank line
    ['No', 'NIS', 'NISN', 'Nama Siswa', 'JK', 'Kelas', 'Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', 'Total Hari', '% Kehadiran'],
  ];

  students.forEach((stu, idx) => {
    rows.push([
      idx + 1,
      stu.nis,
      stu.nisn || '-',
      stu.fullName,
      stu.gender,
      stu.className,
      stu.hadir,
      stu.sakit,
      stu.izin,
      stu.alpa,
      stu.totalTercatat,
      stu.persentase !== null ? `${stu.persentase}%` : '-',
    ]);
  });

  // Summary Row
  rows.push(['']);
  rows.push([
    'TOTAL MADRASAH',
    '',
    '',
    '',
    '',
    '',
    summary.hadir,
    summary.sakit,
    summary.izin,
    summary.alpa,
    summary.totalTercatat,
    summary.persentase !== null ? `${summary.persentase}%` : '-',
  ]);

  // Signatures
  rows.push(['']);
  rows.push(['', '', '', '', '', '', '', '', '', `${settings.reportCity}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`]);
  rows.push(['', '', 'Mengetahui,', '', '', '', '', '', '', 'Penanggung Jawab Presensi,']);
  rows.push(['', '', 'Kepala Madrasah,', '', '', '', '', '', '', settings.reportSignatoryTitle]);
  rows.push(['']);
  rows.push(['']);
  rows.push(['', '', settings.principalName, '', '', '', '', '', '', settings.studentAffairsName]);
  rows.push(['', '', `NIP. ${settings.principalNip}`, '', '', '', '', '', '', `NIP. ${settings.studentAffairsNip}`]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NIS
    { wch: 16 }, // NISN
    { wch: 32 }, // Nama
    { wch: 6 },  // JK
    { wch: 14 }, // Kelas
    { wch: 12 }, // Hadir
    { wch: 12 }, // Sakit
    { wch: 12 }, // Izin
    { wch: 12 }, // Alpa
    { wch: 14 }, // Total
    { wch: 15 }, // Persentase
  ];

  const wb = XLSX.utils.book_new();
  const safeSheetName = (className || 'Rekapitulasi').substring(0, 30);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const filename = `Rekap_Presensi_${(className || 'Madrasah').replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
