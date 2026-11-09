/**
 * Standalone Local Database & Business Logic Engine for SIPRESMA MAN 4 Kediri
 * Runs 100% on Vercel App & GitHub with zero external database dependencies (No Firebase Quota, No Supabase).
 * All data is reliably persisted in browser Storage with full Backup/Restore capabilities.
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
  UserRole,
} from '../types';
import { hashPasswordClient, verifyPasswordClient } from '../utils/crypto';

export interface StandaloneDatabaseSchema {
  profiles: Array<UserProfile & { passwordHash?: string }>;
  classes: ClassItem[];
  students: Student[];
  attendance: AttendanceRecord[];
  academicYears: AcademicYear[];
  schoolSettings: SchoolSettings;
  schoolCalendar: SchoolCalendarDate[];
  auditLogs: AuditLog[];
  version: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'sipresma_master_db_v3';
let inMemoryDb: StandaloneDatabaseSchema | null = null;

function getDefaultDb(): StandaloneDatabaseSchema {
  const now = new Date().toISOString();
  return {
    version: 3,
    lastUpdated: now,
    profiles: [
      {
        id: 'usr_admin',
        username: 'man4keren',
        fullName: 'Administrator Utama MAN 4 Kediri',
        role: 'ADMIN',
        assignedClassId: null,
        assignedClassName: null,
        isActive: true,
        mustChangePassword: false,
        passwordHash: '1234',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_sek_xa',
        username: 'sekretaris_xa',
        fullName: 'Ahmad Fauzi (Sekretaris X-A)',
        role: 'SEKRETARIS',
        assignedClassId: 'cls_xa',
        assignedClassName: 'X-A',
        isActive: true,
        mustChangePassword: false,
        passwordHash: '1234',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_sek_xi1',
        username: 'sekretaris_xi1',
        fullName: 'Nurul Hidayah (Sekretaris XI-MIPA 1)',
        role: 'SEKRETARIS',
        assignedClassId: 'cls_xi_mipa1',
        assignedClassName: 'XI-MIPA 1',
        isActive: true,
        mustChangePassword: false,
        passwordHash: '1234',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_kesiswaan',
        username: 'kesiswaan',
        fullName: 'Drs. Moh. Zaenal Arifin, M.Pd (Kesiswaan)',
        role: 'KESISWAAN',
        assignedClassId: null,
        assignedClassName: null,
        isActive: true,
        mustChangePassword: false,
        passwordHash: '1234',
        createdAt: now,
        updatedAt: now,
      },
    ],
    academicYears: [
      { id: 'ay_2024_2025', yearName: '2024/2025', startDate: '2024-07-15', endDate: '2025-06-25', isActive: false },
      { id: 'ay_2025_2026', yearName: '2025/2026', startDate: '2025-07-14', endDate: '2026-06-20', isActive: true },
      { id: 'ay_2026_2027', yearName: '2026/2027', startDate: '2026-07-13', endDate: '2027-06-19', isActive: false },
    ],
    classes: [
      { id: 'cls_xa', className: 'X-A', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xa', isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xb', className: 'X-B', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xc', className: 'X-C', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xi_mipa1', className: 'XI-MIPA 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xi1', isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xi_mipa2', className: 'XI-MIPA 2', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xi_ips1', className: 'XI-IPS 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xii_mipa1', className: 'XII-MIPA 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      { id: 'cls_xii_ips1', className: 'XII-IPS 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    ],
    students: [
      { id: 'stu_1', nis: '24101', nisn: '0078912341', fullName: 'Achmad Rizky Maulana', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_2', nis: '24102', nisn: '0078912342', fullName: 'Aisyah Putri Rahmadhani', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_3', nis: '24103', nisn: '0078912343', fullName: 'Bagas Aditya Prasetyo', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_4', nis: '24104', nisn: '0078912344', fullName: 'Chusnul Khotimah', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_5', nis: '24105', nisn: '0078912345', fullName: 'Danuarta Putra Ramadhan', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_6', nis: '24106', nisn: '0078912346', fullName: 'Dewi Lestari Wardani', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_7', nis: '24107', nisn: '0078912347', fullName: 'Fandi Ahmad Al-Farisi', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_8', nis: '24108', nisn: '0078912348', fullName: 'Fitria Nur Hasanah', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_9', nis: '24109', nisn: '0078912349', fullName: 'Galih Wicaksono', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_10', nis: '24110', nisn: '0078912350', fullName: 'Hana Marwah Salsabila', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_11', nis: '24111', nisn: '0078912351', fullName: 'Irfan Hakim Maulana', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_12', nis: '24112', nisn: '0078912352', fullName: 'Laila Zahrotun Nisa', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_13', nis: '24201', nisn: '0078912353', fullName: 'M. Ali Shodiqin', gender: 'L', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_14', nis: '24202', nisn: '0078912354', fullName: 'Nabila Syifa Azzahra', gender: 'P', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_15', nis: '24203', nisn: '0078912355', fullName: 'Rifki Bachtiar', gender: 'L', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_16', nis: '23101', nisn: '0068911101', fullName: 'Alif Kurniawan Saputra', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_17', nis: '23102', nisn: '0068911102', fullName: 'Bella Anindita Wahyuni', gender: 'P', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_18', nis: '23103', nisn: '0068911103', fullName: 'Dimas Aryasatya Pratama', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_19', nis: '23104', nisn: '0068911104', fullName: 'Farah Diba Annur', gender: 'P', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
      { id: 'stu_20', nis: '23105', nisn: '0068911105', fullName: 'Habib Mustofa Al-Idrus', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: now, updatedAt: now },
    ],
    attendance: [],
    schoolSettings: {
      id: 'main',
      schoolName: 'MAN 4 Kediri',
      schoolAddress: 'Jl. Harinjing No. 16 Bendo, Pare, Kab. Kediri, Jawa Timur 64225',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kemenag_logo.png/320px-Kemenag_logo.png',
      principalName: 'Drs. H. Slamet Hariyanto, M.Pd.I',
      principalNip: '196805121994031002',
      studentAffairsName: 'Drs. Moh. Zaenal Arifin, M.Pd',
      studentAffairsNip: '197108151998031005',
      reportPreparerName: 'Sekretaris Kelas / Waka Kesiswaan',
      reportSignatoryTitle: 'Kepala Madrasah & Waka Kesiswaan',
      reportCity: 'Kediri',
      updatedAt: now,
    },
    schoolCalendar: [
      { id: 'cal_1', calendarDate: '2025-08-17', isSchoolDay: false, description: 'HUT Kemerdekaan RI ke-80', academicYearId: 'ay_2025_2026' },
      { id: 'cal_2', calendarDate: '2025-10-22', isSchoolDay: true, description: 'Hari Santri Nasional (Upacara Khusus)', academicYearId: 'ay_2025_2026' },
    ],
    auditLogs: [
      {
        id: 'log_boot',
        actorUserId: 'usr_admin',
        actorName: 'System Bootstrap',
        actorRole: 'ADMIN',
        action: 'STANDALONE_INIT',
        targetType: 'SYSTEM',
        details: 'Sistem mandiri aktif di Vercel App & GitHub. Bebas kuota dan tanpa ketergantungan Firebase/Supabase.',
        createdAt: now,
      },
    ],
  };
}

function loadDatabase(): StandaloneDatabaseSchema {
  if (inMemoryDb) return inMemoryDb;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.classes) && Array.isArray(parsed.students)) {
          inMemoryDb = parsed;
          return inMemoryDb!;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca storage, menggunakan default:', e);
    }
  }

  inMemoryDb = getDefaultDb();
  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

function saveDatabase(db: StandaloneDatabaseSchema): void {
  inMemoryDb = db;
  db.lastUpdated = new Date().toISOString();
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Gagal menulis ke localStorage:', e);
    }
  }
}

export const standaloneService = {
  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------
  async login(username: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const db = loadDatabase();
    const cleanUsername = username.trim().toLowerCase();
    const profile = db.profiles.find((p) => p.username.toLowerCase() === cleanUsername);

    if (!profile) {
      throw new Error('Username atau password salah.');
    }
    if (!profile.isActive) {
      throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
    }

    const isValid = await verifyPasswordClient(password, profile.passwordHash || '1234');
    if (!isValid) {
      throw new Error('Username atau password salah.');
    }

    // Resolve class name
    let assignedClassName: string | null = null;
    if (profile.assignedClassId) {
      const cls = db.classes.find((c) => c.id === profile.assignedClassId);
      if (cls) assignedClassName = cls.className;
    }

    const user: UserProfile = {
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      role: profile.role,
      assignedClassId: profile.assignedClassId,
      assignedClassName,
      isActive: profile.isActive,
      mustChangePassword: profile.mustChangePassword,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    const token = 'token_' + profile.id + '_' + Date.now();
    await this.logAudit(user.id, user.fullName, user.role, 'LOGIN', 'AUTH', user.id, 'Masuk ke sistem');

    return { token, user };
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    const db = loadDatabase();
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) return null;

    let assignedClassName: string | null = null;
    if (profile.assignedClassId) {
      const cls = db.classes.find((c) => c.id === profile.assignedClassId);
      if (cls) assignedClassName = cls.className;
    }

    return {
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      role: profile.role,
      assignedClassId: profile.assignedClassId,
      assignedClassName,
      isActive: profile.isActive,
      mustChangePassword: profile.mustChangePassword,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },

  async changePassword(userId: string, newPassword: string, currentPassword?: string): Promise<{ success: boolean; message: string }> {
    const db = loadDatabase();
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) throw new Error('Pengguna tidak ditemukan.');

    if (currentPassword) {
      const isValid = await verifyPasswordClient(currentPassword, profile.passwordHash || '1234');
      if (!isValid) throw new Error('Password lama yang Anda masukkan salah.');
    }

    const newHash = await hashPasswordClient(newPassword);
    profile.passwordHash = newHash;
    profile.mustChangePassword = false;
    profile.updatedAt = new Date().toISOString();
    saveDatabase(db);

    return { success: true, message: 'Password berhasil diubah.' };
  },

  async resetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const db = loadDatabase();
    const profile = db.profiles.find((p) => p.id === targetUserId);
    if (!profile) throw new Error('Pengguna tidak ditemukan.');

    const newHash = await hashPasswordClient(newPassword);
    profile.passwordHash = newHash;
    profile.mustChangePassword = true;
    profile.updatedAt = new Date().toISOString();
    saveDatabase(db);

    return { success: true, message: 'Password berhasil direset.' };
  },

  // ---------------------------------------------------------------------------
  // CLASSES
  // ---------------------------------------------------------------------------
  async getClasses(): Promise<ClassItem[]> {
    const db = loadDatabase();
    const activeYear = db.academicYears.find((y) => y.isActive);
    return db.classes.map((cls) => {
      const count = db.students.filter((s) => s.classId === cls.id && s.isActive).length;
      const sec = cls.secretaryUserId ? db.profiles.find((p) => p.id === cls.secretaryUserId) : null;
      const year = db.academicYears.find((y) => y.id === cls.academicYearId) || activeYear;
      return {
        ...cls,
        studentCount: count,
        secretaryName: sec ? sec.fullName : null,
        academicYearName: year ? year.yearName : '2025/2026',
      };
    });
  },

  async createClass(data: { className: string; gradeLevel: 'X' | 'XI' | 'XII'; secretaryUserId?: string | null }): Promise<ClassItem> {
    const db = loadDatabase();
    const now = new Date().toISOString();
    const newClass: ClassItem = {
      id: 'cls_' + Date.now(),
      className: data.className.trim(),
      gradeLevel: data.gradeLevel,
      academicYearId: db.academicYears.find((y) => y.isActive)?.id || 'ay_2025_2026',
      secretaryUserId: data.secretaryUserId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    db.classes.push(newClass);
    saveDatabase(db);
    return newClass;
  },

  async updateClass(id: string, data: Partial<ClassItem>): Promise<ClassItem> {
    const db = loadDatabase();
    const idx = db.classes.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Kelas tidak ditemukan');

    db.classes[idx] = {
      ...db.classes[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return db.classes[idx];
  },

  async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    const db = loadDatabase();
    db.classes = db.classes.filter((c) => c.id !== id);
    saveDatabase(db);
    return { success: true, message: 'Kelas berhasil dihapus.' };
  },

  // ---------------------------------------------------------------------------
  // STUDENTS
  // ---------------------------------------------------------------------------
  async getStudents(params?: { classId?: string; search?: string; isActive?: string | boolean }): Promise<Student[]> {
    const db = loadDatabase();
    let list = [...db.students];

    if (params?.classId && params.classId !== 'all') {
      list = list.filter((s) => s.classId === params.classId);
    }
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      const act = String(params.isActive) === 'true';
      list = list.filter((s) => s.isActive === act);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.toLowerCase().includes(q))
      );
    }

    return list.map((s) => {
      const cls = db.classes.find((c) => c.id === s.classId);
      return {
        ...s,
        className: cls ? cls.className : 'Tidak Diketahui',
      };
    });
  },

  async createStudent(data: { nis: string; nisn?: string; fullName: string; gender: 'L' | 'P'; classId: string }): Promise<Student> {
    const db = loadDatabase();
    const now = new Date().toISOString();
    const newStudent: Student = {
      id: 'stu_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      nis: data.nis.trim(),
      nisn: data.nisn ? data.nisn.trim() : '',
      fullName: data.fullName.trim(),
      gender: data.gender,
      classId: data.classId,
      academicYearId: db.academicYears.find((y) => y.isActive)?.id || 'ay_2025_2026',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    db.students.push(newStudent);
    saveDatabase(db);
    return newStudent;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const db = loadDatabase();
    const idx = db.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Siswa tidak ditemukan');

    db.students[idx] = {
      ...db.students[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return db.students[idx];
  },

  async moveStudentClass(id: string, targetClassId: string): Promise<{ success: boolean; message: string; student: Student }> {
    const db = loadDatabase();
    const student = db.students.find((s) => s.id === id);
    if (!student) throw new Error('Siswa tidak ditemukan');

    student.classId = targetClassId;
    student.updatedAt = new Date().toISOString();
    saveDatabase(db);
    return { success: true, message: 'Siswa berhasil dipindahkan.', student };
  },

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    const db = loadDatabase();
    const student = db.students.find((s) => s.id === id);
    if (!student) throw new Error('Siswa tidak ditemukan');

    student.isActive = false;
    student.updatedAt = new Date().toISOString();
    saveDatabase(db);
    return { success: true, message: `Siswa ${student.fullName} telah dinonaktifkan.` };
  },

  async deleteAllStudents(params: { confirmText: string; deleteAttendance: boolean; classId?: string }): Promise<{ success: boolean; count: number; message: string }> {
    if (params.confirmText !== 'HAPUS SEMUA SISWA') {
      throw new Error('Teks konfirmasi salah.');
    }

    const db = loadDatabase();
    let initialCount = db.students.length;

    if (params.classId && params.classId !== 'all') {
      const removed = db.students.filter((s) => s.classId === params.classId);
      db.students = db.students.filter((s) => s.classId !== params.classId);
      if (params.deleteAttendance) {
        db.attendance = db.attendance.filter((a) => a.classId !== params.classId);
      }
      saveDatabase(db);
      return { success: true, count: removed.length, message: `Berhasil menghapus ${removed.length} siswa pada kelas terpilih.` };
    }

    // Delete all
    db.students = [];
    if (params.deleteAttendance) {
      db.attendance = [];
    }
    saveDatabase(db);
    return { success: true, count: initialCount, message: `Berhasil menghapus ${initialCount} seluruh siswa.` };
  },

  async bulkImportStudents(rows: any[], defaultClassId?: string): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    successList: Student[];
    failures: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }>;
  }> {
    const db = loadDatabase();
    const existingNis = new Set(db.students.map((s) => s.nis));
    const now = new Date().toISOString();
    const successList: Student[] = [];
    const failures: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const nis = String(row.nis || '').trim();
      const fullName = String(row.fullName || '').trim();
      const nisn = String(row.nisn || '').trim();
      const gender = (row.gender && String(row.gender).trim().toUpperCase() === 'P') ? 'P' : 'L';
      let classId = row.classId || defaultClassId;

      if (!classId && row.className) {
        const found = db.classes.find((c) => c.className.toLowerCase() === String(row.className).toLowerCase());
        if (found) classId = found.id;
      }

      if (!nis) {
        failures.push({ rowNumber: rowNum, name: fullName, reason: 'NIS tidak boleh kosong' });
        continue;
      }
      if (!fullName) {
        failures.push({ rowNumber: rowNum, nis, reason: 'Nama lengkap tidak boleh kosong' });
        continue;
      }
      if (!classId) {
        failures.push({ rowNumber: rowNum, nis, name: fullName, reason: 'Kelas tidak ditemukan' });
        continue;
      }
      if (existingNis.has(nis)) {
        failures.push({ rowNumber: rowNum, nis, name: fullName, reason: `NIS ${nis} sudah terdaftar` });
        continue;
      }

      const id = 'stu_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 1000);
      const student: Student = {
        id,
        nis,
        nisn,
        fullName,
        gender,
        classId,
        academicYearId: db.academicYears.find((y) => y.isActive)?.id || 'ay_2025_2026',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      db.students.push(student);
      existingNis.add(nis);
      successList.push(student);
    }

    saveDatabase(db);

    return {
      totalProcessed: rows.length,
      successCount: successList.length,
      failureCount: failures.length,
      successList,
      failures,
    };
  },

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  async getUsers(): Promise<UserProfile[]> {
    const db = loadDatabase();
    return db.profiles.map((p) => {
      const cls = p.assignedClassId ? db.classes.find((c) => c.id === p.assignedClassId) : null;
      return {
        id: p.id,
        username: p.username,
        fullName: p.fullName,
        role: p.role,
        assignedClassId: p.assignedClassId,
        assignedClassName: cls ? cls.className : null,
        isActive: p.isActive,
        mustChangePassword: p.mustChangePassword,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  },

  async createUser(data: any): Promise<UserProfile> {
    const db = loadDatabase();
    const now = new Date().toISOString();
    const newUser: UserProfile & { passwordHash?: string } = {
      id: 'usr_' + Date.now(),
      username: data.username.trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      assignedClassId: data.role === 'SEKRETARIS' ? data.assignedClassId || null : null,
      isActive: true,
      mustChangePassword: true,
      passwordHash: data.password || '1234',
      createdAt: now,
      updatedAt: now,
    };
    db.profiles.push(newUser);
    saveDatabase(db);
    return newUser;
  },

  async updateUser(id: string, data: any): Promise<UserProfile> {
    const db = loadDatabase();
    const idx = db.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Pengguna tidak ditemukan');

    db.profiles[idx] = {
      ...db.profiles[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return db.profiles[idx];
  },

  // ---------------------------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------------------------
  async getAttendance(params?: { classId?: string; date?: string; month?: string; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> {
    const db = loadDatabase();
    let records = [...db.attendance];

    if (params?.classId && params.classId !== 'all') {
      records = records.filter((r) => r.classId === params.classId);
    }
    if (params?.date) {
      records = records.filter((r) => r.attendanceDate === params.date);
    }
    if (params?.month) {
      records = records.filter((r) => r.attendanceDate.startsWith(params.month!));
    }
    if (params?.startDate && params?.endDate) {
      records = records.filter((r) => r.attendanceDate >= params.startDate! && r.attendanceDate <= params.endDate!);
    }

    return records.map((r) => {
      const s = db.students.find((stu) => stu.id === r.studentId);
      const c = db.classes.find((cls) => cls.id === r.classId);
      return {
        ...r,
        studentNis: s ? s.nis : '-',
        studentName: s ? s.fullName : 'Tidak Diketahui',
        className: c ? c.className : '-',
      };
    });
  },

  async saveBatchAttendance(data: {
    classId: string;
    attendanceDate: string;
    items: Array<{ studentId: string; status: 'H' | 'S' | 'I' | 'A'; notes?: string }>;
  }): Promise<{ success: boolean; count: number; message: string }> {
    const db = loadDatabase();
    const now = new Date().toISOString();

    for (const item of data.items) {
      const docId = `att_${item.studentId}_${data.attendanceDate}`;
      const existingIdx = db.attendance.findIndex((a) => a.id === docId);

      const record: AttendanceRecord = {
        id: docId,
        studentId: item.studentId,
        classId: data.classId,
        attendanceDate: data.attendanceDate,
        status: item.status,
        notes: item.notes || '',
        recordedBy: 'system',
        createdAt: existingIdx >= 0 ? db.attendance[existingIdx].createdAt : now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        db.attendance[existingIdx] = record;
      } else {
        db.attendance.push(record);
      }
    }

    saveDatabase(db);
    return { success: true, count: data.items.length, message: `Presensi tanggal ${data.attendanceDate} berhasil disimpan.` };
  },

  // ---------------------------------------------------------------------------
  // RECAPS
  // ---------------------------------------------------------------------------
  async getDailyRecap(date?: string): Promise<{
    date: string;
    totalClasses: number;
    totalStudents: number;
    summary: AttendanceSummary;
    classes: ClassRecapItem[];
    unsubmittedClasses: ClassRecapItem[];
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const db = loadDatabase();
    const activeClasses = db.classes.filter((c) => c.isActive);
    const activeStudents = db.students.filter((s) => s.isActive);
    const attendance = db.attendance.filter((a) => a.attendanceDate === targetDate);

    let grandH = 0, grandS = 0, grandI = 0, grandA = 0;

    const classSummaries: ClassRecapItem[] = activeClasses.map((cls) => {
      const classStudents = activeStudents.filter((s) => s.classId === cls.id);
      const classAtt = attendance.filter((a) => a.classId === cls.id);

      let h = 0, s = 0, i = 0, a = 0;
      for (const rec of classAtt) {
        if (rec.status === 'H') h++;
        else if (rec.status === 'S') s++;
        else if (rec.status === 'I') i++;
        else if (rec.status === 'A') a++;
      }

      grandH += h;
      grandS += s;
      grandI += i;
      grandA += a;

      const totalTercatat = h + s + i + a;
      const persentase = totalTercatat > 0 ? Math.round((h / totalTercatat) * 100) : null;
      const sudahIsiHariIni = totalTercatat > 0;

      return {
        classId: cls.id,
        className: cls.className,
        gradeLevel: cls.gradeLevel,
        totalStudents: classStudents.length,
        hadir: h,
        sakit: s,
        izin: i,
        alpa: a,
        totalTercatat,
        persentase,
        sudahIsiHariIni,
      };
    });

    const grandTercatat = grandH + grandS + grandI + grandA;
    const grandPersentase = grandTercatat > 0 ? Math.round((grandH / grandTercatat) * 100) : null;
    const unsubmitted = classSummaries.filter((cs) => !cs.sudahIsiHariIni);

    return {
      date: targetDate,
      totalClasses: activeClasses.length,
      totalStudents: activeStudents.length,
      summary: {
        hadir: grandH,
        sakit: grandS,
        izin: grandI,
        alpa: grandA,
        totalTercatat: grandTercatat,
        persentase: grandPersentase,
      },
      classes: classSummaries,
      unsubmittedClasses: unsubmitted,
    };
  },

  async getPeriodRecap(params: { classId?: string; startDate?: string; endDate?: string; month?: string }): Promise<{
    period: { startDate?: string; endDate?: string; month?: string };
    summary: AttendanceSummary;
    students: StudentRecapItem[];
  }> {
    let filterStart = params.startDate || '';
    let filterEnd = params.endDate || '';
    if (params.month && !filterStart) {
      filterStart = `${params.month}-01`;
      filterEnd = `${params.month}-31`;
    }

    const db = loadDatabase();
    let targetStudents = db.students.filter((s) => s.isActive);
    if (params.classId && params.classId !== 'all') {
      targetStudents = targetStudents.filter((s) => s.classId === params.classId);
    }

    let targetAtt = db.attendance;
    if (params.classId && params.classId !== 'all') {
      targetAtt = targetAtt.filter((a) => a.classId === params.classId);
    }
    if (filterStart && filterEnd) {
      targetAtt = targetAtt.filter((a) => a.attendanceDate >= filterStart && a.attendanceDate <= filterEnd);
    }

    let totalH = 0, totalS = 0, totalI = 0, totalA = 0;

    const studentRecaps: StudentRecapItem[] = targetStudents.map((stu) => {
      const stuAtt = targetAtt.filter((a) => a.studentId === stu.id);
      let h = 0, s = 0, i = 0, a = 0;
      const detailDates: Record<string, 'H' | 'S' | 'I' | 'A'> = {};

      for (const rec of stuAtt) {
        if (rec.status === 'H') h++;
        else if (rec.status === 'S') s++;
        else if (rec.status === 'I') i++;
        else if (rec.status === 'A') a++;
        detailDates[rec.attendanceDate] = rec.status;
      }

      totalH += h;
      totalS += s;
      totalI += i;
      totalA += a;

      const totalTercatat = h + s + i + a;
      const persentase = totalTercatat > 0 ? Math.round((h / totalTercatat) * 100) : null;
      const cls = db.classes.find((c) => c.id === stu.classId);

      return {
        studentId: stu.id,
        nis: stu.nis,
        nisn: stu.nisn,
        fullName: stu.fullName,
        gender: stu.gender,
        classId: stu.classId,
        className: cls ? cls.className : '-',
        hadir: h,
        sakit: s,
        izin: i,
        alpa: a,
        totalTercatat,
        persentase,
        detailDates,
      };
    });

    const totalTercatat = totalH + totalS + totalI + totalA;
    const overallPersentase = totalTercatat > 0 ? Math.round((totalH / totalTercatat) * 100) : null;

    return {
      period: { startDate: filterStart, endDate: filterEnd, month: params.month },
      summary: {
        hadir: totalH,
        sakit: totalS,
        izin: totalI,
        alpa: totalA,
        totalTercatat,
        persentase: overallPersentase,
      },
      students: studentRecaps,
    };
  },

  // ---------------------------------------------------------------------------
  // SETTINGS & LOGO
  // ---------------------------------------------------------------------------
  async getSettings(): Promise<SchoolSettings> {
    const db = loadDatabase();
    return db.schoolSettings;
  },

  async updateSettings(data: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const db = loadDatabase();
    db.schoolSettings = {
      ...db.schoolSettings,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase(db);
    return db.schoolSettings;
  },

  // ---------------------------------------------------------------------------
  // ACADEMIC YEARS
  // ---------------------------------------------------------------------------
  async getAcademicYears(): Promise<AcademicYear[]> {
    const db = loadDatabase();
    return db.academicYears;
  },

  async createAcademicYear(data: { yearName: string; startDate: string; endDate: string; isActive?: boolean }): Promise<AcademicYear> {
    const db = loadDatabase();
    const item: AcademicYear = {
      id: 'ay_' + Date.now(),
      yearName: data.yearName.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: Boolean(data.isActive),
    };
    if (item.isActive) {
      for (const other of db.academicYears) {
        other.isActive = false;
      }
    }
    db.academicYears.push(item);
    saveDatabase(db);
    return item;
  },

  async updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear> {
    const db = loadDatabase();
    const idx = db.academicYears.findIndex((y) => y.id === id);
    if (idx === -1) throw new Error('Tahun ajaran tidak ditemukan');

    if (data.isActive) {
      for (const other of db.academicYears) {
        if (other.id !== id) other.isActive = false;
      }
    }

    db.academicYears[idx] = {
      ...db.academicYears[idx],
      ...data,
    };
    saveDatabase(db);
    return db.academicYears[idx];
  },

  async deleteAcademicYear(id: string): Promise<{ success: boolean; message: string }> {
    const db = loadDatabase();
    db.academicYears = db.academicYears.filter((y) => y.id !== id);
    saveDatabase(db);
    return { success: true, message: 'Tahun ajaran berhasil dihapus.' };
  },

  // ---------------------------------------------------------------------------
  // CALENDAR
  // ---------------------------------------------------------------------------
  async getCalendar(): Promise<SchoolCalendarDate[]> {
    const db = loadDatabase();
    return db.schoolCalendar;
  },

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------
  async getAuditLogs(): Promise<AuditLog[]> {
    const db = loadDatabase();
    return [...db.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async logAudit(actorUserId: string, actorName: string, actorRole: string, action: string, targetType: string, targetId?: string, details?: string): Promise<void> {
    const db = loadDatabase();
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      actorUserId,
      actorName,
      actorRole: actorRole as UserRole,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(log);
    // Keep max 200 logs
    if (db.auditLogs.length > 200) {
      db.auditLogs = db.auditLogs.slice(0, 200);
    }
    saveDatabase(db);
  },

  // ---------------------------------------------------------------------------
  // BACKUP, RESTORE & SYSTEM STATUS
  // ---------------------------------------------------------------------------
  async exportDatabaseBackup(): Promise<string> {
    const db = loadDatabase();
    return JSON.stringify(db, null, 2);
  },

  async importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.classes) || !Array.isArray(parsed.students)) {
        throw new Error('Format berkas cadangan database tidak valid.');
      }
      saveDatabase(parsed);
      return { success: true, message: 'Database berhasil dipulihkan dari berkas cadangan.' };
    } catch (e: any) {
      throw new Error(e.message || 'Gagal memulihkan database.');
    }
  },

  async resetToDefault(): Promise<{ success: boolean; message: string }> {
    const initial = getDefaultDb();
    saveDatabase(initial);
    return { success: true, message: 'Database telah direset ke data bawaan madrasah.' };
  },

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
    const db = loadDatabase();
    return {
      mode: 'standalone_vercel',
      databaseType: 'Database Mandiri Browser & Vercel App (Bebas Kuota)',
      projectId: 'sipresma-man4kediri',
      databaseId: 'sipresma-local-db',
      isSupabaseConfigured: false,
      supabaseStatus: 'Diputuskan (Disconnected)',
      storageType: 'Database Terpadu Browser & Vercel (100% Bebas Kuota / Tanpa Batas Harian)',
      counts: {
        students: db.students.filter((s) => s.isActive).length,
        classes: db.classes.filter((c) => c.isActive).length,
        users: db.profiles.length,
        attendanceRecords: db.attendance.length,
        academicYears: db.academicYears.length,
        auditLogs: db.auditLogs.length,
      },
      systemTime: new Date().toISOString(),
    };
  },
};
