/**
 * Word (.docx) Export Utility using docx library
 */
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { StudentRecapItem, AttendanceSummary, SchoolSettings } from '../types';

export async function exportAttendanceRecapWord(params: {
  title: string;
  periodLabel: string;
  className?: string;
  students: StudentRecapItem[];
  summary: AttendanceSummary;
  settings: SchoolSettings;
}) {
  const { title, periodLabel, className, students, summary, settings } = params;

  const tableRows: TableRow[] = [];

  // Table Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: [
        createCell('No', 6, true, AlignmentType.CENTER),
        createCell('NIS', 12, true, AlignmentType.CENTER),
        createCell('Nama Siswa', 34, true, AlignmentType.LEFT),
        createCell('JK', 6, true, AlignmentType.CENTER),
        createCell('Kelas', 12, true, AlignmentType.CENTER),
        createCell('H', 6, true, AlignmentType.CENTER),
        createCell('S', 6, true, AlignmentType.CENTER),
        createCell('I', 6, true, AlignmentType.CENTER),
        createCell('A', 6, true, AlignmentType.CENTER),
        createCell('Total', 8, true, AlignmentType.CENTER),
        createCell('% Hadir', 10, true, AlignmentType.CENTER),
      ],
    })
  );

  // Student Rows
  students.forEach((stu, index) => {
    tableRows.push(
      new TableRow({
        children: [
          createCell(String(index + 1), 6, false, AlignmentType.CENTER),
          createCell(stu.nis, 12, false, AlignmentType.CENTER),
          createCell(stu.fullName, 34, false, AlignmentType.LEFT),
          createCell(stu.gender, 6, false, AlignmentType.CENTER),
          createCell(stu.className, 12, false, AlignmentType.CENTER),
          createCell(String(stu.hadir), 6, false, AlignmentType.CENTER),
          createCell(String(stu.sakit), 6, false, AlignmentType.CENTER),
          createCell(String(stu.izin), 6, false, AlignmentType.CENTER),
          createCell(String(stu.alpa), 6, false, AlignmentType.CENTER),
          createCell(String(stu.totalTercatat), 8, false, AlignmentType.CENTER),
          createCell(stu.persentase !== null ? `${stu.persentase}%` : '-', 10, true, AlignmentType.CENTER),
        ],
      })
    );
  });

  // Summary Row
  tableRows.push(
    new TableRow({
      children: [
        createCell('TOTAL', 70, true, AlignmentType.RIGHT, 5),
        createCell(String(summary.hadir), 6, true, AlignmentType.CENTER),
        createCell(String(summary.sakit), 6, true, AlignmentType.CENTER),
        createCell(String(summary.izin), 6, true, AlignmentType.CENTER),
        createCell(String(summary.alpa), 6, true, AlignmentType.CENTER),
        createCell(String(summary.totalTercatat), 8, true, AlignmentType.CENTER),
        createCell(summary.persentase !== null ? `${summary.persentase}%` : '-', 10, true, AlignmentType.CENTER),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // KOP SURAT
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'KANTOR KEMENTERIAN AGAMA KABUPATEN KEDIRI', bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: settings.schoolName.toUpperCase(), bold: true, size: 28, color: '065F46' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: settings.schoolAddress, size: 18, italics: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '_________________________________________________________________________________',
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),

          // TITLE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: title.toUpperCase(), bold: true, size: 24, underline: {} }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Periode: ${periodLabel}${className ? ` | Kelas: ${className}` : ''}`,
                italics: true,
                size: 20,
              }),
            ],
          }),

          // TABLE
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({ text: '', spacing: { after: 400 } }),

          // SIGNATURE BLOCK
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `${settings.reportCity}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                size: 20,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder(),
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Mengetahui,', size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Kepala Madrasah,', bold: true, size: 20 })] }),
                      new Paragraph({ text: '', spacing: { after: 1200 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: settings.principalName, bold: true, underline: {}, size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP. ${settings.principalNip}`, size: 18 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder(),
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Petugas / Waka Kesiswaan,', size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: settings.reportSignatoryTitle, bold: true, size: 20 })] }),
                      new Paragraph({ text: '', spacing: { after: 1200 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: settings.studentAffairsName, bold: true, underline: {}, size: 20 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `NIP. ${settings.studentAffairsNip}`, size: 18 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Presensi_${(className || 'Madrasah').replace(/\s+/g, '_')}_${Date.now()}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createCell(text: string, widthPercent: number, isBold: boolean, alignment: (typeof AlignmentType)[keyof typeof AlignmentType], colSpan?: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    columnSpan: colSpan,
    children: [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text,
            bold: isBold,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function noBorder() {
  const borderDef = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return {
    top: borderDef,
    bottom: borderDef,
    left: borderDef,
    right: borderDef,
  };
}
