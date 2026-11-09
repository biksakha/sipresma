/**
 * Type definitions for SIPRESMA — Sistem Informasi Presensi Madrasah MAN 4 Kediri
 */

export type UserRole = 'ADMIN' | 'SEKRETARIS' | 'KESISWAAN';

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  assignedClassId?: string | null;
  assignedClassName?: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassItem {
  id: string;
  className: string;
  gradeLevel: 'X' | 'XI' | 'XII';
  academicYearId: string;
  academicYearName?: string;
  secretaryUserId?: string | null;
  secretaryName?: string | null;
  isActive: boolean;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: 'L' | 'P';
  classId: string;
  className?: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentNis?: string;
  studentName?: string;
  classId: string;
  className?: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Semester {
  id: string;
  academicYearId: string;
  semesterName: string; // 'Ganjil' | 'Genap'
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SchoolSettings {
  id: string;
  schoolName: string;
  schoolAddress: string;
  logoUrl: string;
  principalName: string;
  principalNip: string;
  studentAffairsName: string;
  studentAffairsNip: string;
  reportPreparerName: string;
  reportSignatoryTitle: string;
  reportCity: string;
  updatedAt: string;
}

export interface SchoolCalendarDate {
  id: string;
  calendarDate: string; // YYYY-MM-DD
  isSchoolDay: boolean;
  description: string;
  academicYearId: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface AttendanceSummary {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalTercatat: number;
  persentase: number | null; // null if totalTercatat === 0
}

export interface StudentRecapItem {
  studentId: string;
  nis: string;
  nisn?: string;
  fullName: string;
  gender: 'L' | 'P';
  classId: string;
  className: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalTercatat: number;
  persentase: number | null;
  detailDates?: Record<string, AttendanceStatus>;
}

export interface ClassRecapItem {
  classId: string;
  className: string;
  gradeLevel: string;
  totalStudents: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalTercatat: number;
  persentase: number | null;
  sudahIsiHariIni: boolean;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}
