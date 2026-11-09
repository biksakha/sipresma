/**
 * Centralized Firebase Firestore API Client for SIPRESMA MAN 4 Kediri
 * All operations query and mutate the centralized Google Cloud Firebase Firestore database.
 */
import {
  UserProfile,
  ClassItem,
  Student,
  AttendanceRecord,
  SchoolSettings,
  SchoolCalendarDate,
  AcademicYear,
  AuditLog,
  StudentRecapItem,
  ClassRecapItem,
  AttendanceSummary,
} from '../types';
import { firestoreService, ensureFirestoreCentralizedData } from './firestoreDb';
import { testFirestoreConnection } from './firebase';

const TOKEN_KEY = 'sipresma_auth_token';
const USER_KEY = 'sipresma_auth_user';

const memStorage = new Map<string, string>();

// Initialize and verify connection to Firestore
testFirestoreConnection().catch((err) => {
  console.warn('Initial Firestore ping note:', err);
});

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return memStorage.get(TOKEN_KEY) || null;
}

export function getStoredUser(): UserProfile | null {
  let raw: string | null = null;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    raw = localStorage.getItem(USER_KEY);
  } else {
    raw = memStorage.get(USER_KEY) || null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: UserProfile): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    memStorage.set(TOKEN_KEY, token);
    memStorage.set(USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredSession(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } else {
    memStorage.delete(TOKEN_KEY);
    memStorage.delete(USER_KEY);
  }
}

export const api = {
  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  async login(username: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await firestoreService.login(username, password);
    setStoredSession(res.token, res.user);
    return res;
  },

  async getMe(): Promise<UserProfile> {
    const storedUser = getStoredUser();
    if (!storedUser) {
      throw new Error('Sesi tidak ditemukan atau telah kedaluwarsa.');
    }
    const user = await firestoreService.getUserById(storedUser.id);
    if (!user) {
      clearStoredSession();
      throw new Error('Akun tidak ditemukan di database terpusat.');
    }
    if (!user.isActive) {
      clearStoredSession();
      throw new Error('Akun Anda telah dinonaktifkan oleh Administrator.');
    }
    setStoredSession(getStoredToken() || 'token_' + user.id, user);
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const storedUser = getStoredUser();
    if (!storedUser) {
      throw new Error('Sesi telah kedaluwarsa. Silakan login kembali.');
    }
    const res = await firestoreService.changePassword(storedUser.id, newPassword, currentPassword);
    // Update local user flag
    const updatedUser = { ...storedUser, mustChangePassword: false };
    setStoredSession(getStoredToken() || 'token_' + storedUser.id, updatedUser);
    return res;
  },

  async resetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return firestoreService.resetPassword(targetUserId, newPassword);
  },

  // ---------------------------------------------------------------------------
  // CLASSES (DATA KELAS)
  // ---------------------------------------------------------------------------
  async getClasses(): Promise<ClassItem[]> {
    return firestoreService.getClasses();
  },

  async createClass(data: { className: string; gradeLevel: 'X' | 'XI' | 'XII'; secretaryUserId?: string | null }): Promise<ClassItem> {
    return firestoreService.createClass(data);
  },

  async updateClass(id: string, data: Partial<ClassItem>): Promise<ClassItem> {
    return firestoreService.updateClass(id, data);
  },

  async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    return firestoreService.deleteClass(id);
  },

  // ---------------------------------------------------------------------------
  // STUDENTS (DATA SISWA)
  // ---------------------------------------------------------------------------
  async getStudents(params?: { classId?: string; search?: string; isActive?: string | boolean }): Promise<Student[]> {
    return firestoreService.getStudents(params);
  },

  async createStudent(data: { nis: string; nisn?: string; fullName: string; gender: 'L' | 'P'; classId: string }): Promise<Student> {
    return firestoreService.createStudent(data);
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    return firestoreService.updateStudent(id, data);
  },

  async moveStudentClass(id: string, targetClassId: string): Promise<{ success: boolean; message: string; student: Student }> {
    return firestoreService.moveStudentClass(id, targetClassId);
  },

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    return firestoreService.deleteStudent(id);
  },

  async deleteAllStudents(params: { confirmText: string; deleteAttendance: boolean; classId?: string }): Promise<{ success: boolean; count: number; message: string }> {
    return firestoreService.deleteAllStudents(params);
  },

  async bulkImportStudents(rows: any[], defaultClassId?: string): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    successList: Student[];
    failures: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }>;
  }> {
    return firestoreService.bulkImportStudents(rows, defaultClassId);
  },

  // ---------------------------------------------------------------------------
  // ACADEMIC YEARS (TAHUN AJARAN)
  // ---------------------------------------------------------------------------
  async getAcademicYears(): Promise<AcademicYear[]> {
    return firestoreService.getAcademicYears();
  },

  async createAcademicYear(data: { yearName: string; startDate: string; endDate: string; isActive?: boolean }): Promise<AcademicYear> {
    return firestoreService.createAcademicYear(data);
  },

  async updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear> {
    return firestoreService.updateAcademicYear(id, data);
  },

  async deleteAcademicYear(id: string): Promise<{ success: boolean; message: string }> {
    return firestoreService.deleteAcademicYear(id);
  },

  // ---------------------------------------------------------------------------
  // USERS (DATA PENGGUNA)
  // ---------------------------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    return firestoreService.getUsers();
  },

  async createUser(data: any): Promise<UserProfile> {
    return firestoreService.createUser(data);
  },

  async updateUser(id: string, data: any): Promise<UserProfile> {
    return firestoreService.updateUser(id, data);
  },

  // ---------------------------------------------------------------------------
  // ATTENDANCE (PRESENSI)
  // ---------------------------------------------------------------------------
  async getAttendance(params?: { classId?: string; date?: string; month?: string; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> {
    return firestoreService.getAttendance(params);
  },

  async saveBatchAttendance(data: {
    classId: string;
    attendanceDate: string;
    items: Array<{ studentId: string; status: 'H' | 'S' | 'I' | 'A'; notes?: string }>;
  }): Promise<{ success: boolean; count: number; message: string }> {
    return firestoreService.saveBatchAttendance(data);
  },

  // ---------------------------------------------------------------------------
  // RECAPITULATION (REKAPITULASI)
  // ---------------------------------------------------------------------------
  async getDailyRecap(date?: string): Promise<{
    date: string;
    totalClasses: number;
    totalStudents: number;
    summary: AttendanceSummary;
    classes: ClassRecapItem[];
    unsubmittedClasses: ClassRecapItem[];
  }> {
    return firestoreService.getDailyRecap(date);
  },

  async getPeriodRecap(params: { classId?: string; startDate?: string; endDate?: string; month?: string }): Promise<{
    period: { startDate?: string; endDate?: string; month?: string };
    summary: AttendanceSummary;
    students: StudentRecapItem[];
  }> {
    return firestoreService.getPeriodRecap(params);
  },

  // ---------------------------------------------------------------------------
  // SCHOOL SETTINGS & REPORT METADATA (TERMASUK LOGO)
  // ---------------------------------------------------------------------------
  async getSettings(): Promise<SchoolSettings> {
    return firestoreService.getSettings();
  },

  async updateSettings(data: Partial<SchoolSettings>): Promise<SchoolSettings> {
    return firestoreService.updateSettings(data);
  },

  // ---------------------------------------------------------------------------
  // CALENDAR
  // ---------------------------------------------------------------------------
  async getCalendar(): Promise<SchoolCalendarDate[]> {
    return firestoreService.getCalendar();
  },

  // ---------------------------------------------------------------------------
  // AUDIT LOGS (RIWAYAT AKTIVITAS)
  // ---------------------------------------------------------------------------
  async getAuditLogs(): Promise<AuditLog[]> {
    return firestoreService.getAuditLogs();
  },

  // ---------------------------------------------------------------------------
  // DATABASE STATUS
  // ---------------------------------------------------------------------------
  async getDatabaseStatus(): Promise<{
    mode: string;
    databaseType: string;
    projectId: string;
    databaseId: string;
    isSupabaseConfigured: boolean;
    supabaseStatus: string;
    storageType: string;
    counts: {
      students: number;
      classes: number;
      users: number;
      attendanceRecords: number;
      academicYears: number;
      auditLogs: number;
    };
    systemTime: string;
  }> {
    return firestoreService.getDatabaseStatus();
  },
};
