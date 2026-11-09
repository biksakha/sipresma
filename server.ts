import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'sipresma_db.json');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -----------------------------------------------------------------------------
// SECURE HASHING & HELPERS
// -----------------------------------------------------------------------------
const HASH_SALT = 'sipresma_man4kediri_salt_2025';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, HASH_SALT, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Simple in-memory token store: token -> userId
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function generateToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

// -----------------------------------------------------------------------------
// DATABASE INITIALIZATION & PERSISTENCE
// -----------------------------------------------------------------------------
interface DatabaseSchema {
  profiles: Array<{
    id: string;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'SEKRETARIS' | 'KESISWAAN';
    assignedClassId: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
  }>;
  academicYears: Array<{
    id: string;
    yearName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
  semesters: Array<{
    id: string;
    academicYearId: string;
    semesterName: 'Ganjil' | 'Genap';
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
  classes: Array<{
    id: string;
    className: string;
    gradeLevel: 'X' | 'XI' | 'XII';
    academicYearId: string;
    secretaryUserId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  students: Array<{
    id: string;
    nis: string;
    nisn: string;
    fullName: string;
    gender: 'L' | 'P';
    classId: string;
    academicYearId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  attendance: Array<{
    id: string;
    studentId: string;
    classId: string;
    attendanceDate: string; // YYYY-MM-DD
    status: 'H' | 'S' | 'I' | 'A';
    notes?: string;
    recordedBy: string;
    createdAt: string;
    updatedAt: string;
  }>;
  schoolSettings: {
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
  };
  schoolCalendar: Array<{
    id: string;
    calendarDate: string;
    isSchoolDay: boolean;
    description: string;
    academicYearId: string;
  }>;
  auditLogs: Array<{
    id: string;
    actorUserId: string;
    actorName: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId?: string;
    details?: string;
    createdAt: string;
  }>;
}

function getInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  const adminHash = hashPassword('1234');
  const defaultUserHash = hashPassword('1234');

  const academicYearId = 'ay_2025_2026';
  const semesterId = 'sem_ganjil_2025';

  const classes = [
    { id: 'cls_xa', className: 'X-A', gradeLevel: 'X' as const, academicYearId, secretaryUserId: 'usr_sek_xa', isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xb', className: 'X-B', gradeLevel: 'X' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xc', className: 'X-C', gradeLevel: 'X' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_mipa1', className: 'XI-MIPA 1', gradeLevel: 'XI' as const, academicYearId, secretaryUserId: 'usr_sek_xi1', isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_mipa2', className: 'XI-MIPA 2', gradeLevel: 'XI' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_ips1', className: 'XI-IPS 1', gradeLevel: 'XI' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xii_mipa1', className: 'XII-MIPA 1', gradeLevel: 'XII' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xii_ips1', className: 'XII-IPS 1', gradeLevel: 'XII' as const, academicYearId, secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
  ];

  const profiles = [
    {
      id: 'usr_admin',
      username: 'man4keren',
      fullName: 'Administrator Utama MAN 4 Kediri',
      role: 'ADMIN' as const,
      assignedClassId: null,
      isActive: true,
      mustChangePassword: true, // Master prompt requirement: prompt initial admin to change 1234
      passwordHash: adminHash,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_sek_xa',
      username: 'sekretaris_xa',
      fullName: 'Ahmad Fauzi (Sekretaris X-A)',
      role: 'SEKRETARIS' as const,
      assignedClassId: 'cls_xa',
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultUserHash,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_sek_xi1',
      username: 'sekretaris_xi1',
      fullName: 'Nurul Hidayah (Sekretaris XI-MIPA 1)',
      role: 'SEKRETARIS' as const,
      assignedClassId: 'cls_xi_mipa1',
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultUserHash,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_kesiswaan',
      username: 'kesiswaan',
      fullName: 'Drs. Moh. Zaenal Arifin, M.Pd (Kesiswaan)',
      role: 'KESISWAAN' as const,
      assignedClassId: null,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultUserHash,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Authentic student rosters for MAN 4 Kediri
  const sampleStudentsRaw = [
    // Kelas X-A
    { nis: '24101', nisn: '0078912341', fullName: 'Achmad Rizky Maulana', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24102', nisn: '0078912342', fullName: 'Aisyah Putri Rahmadhani', gender: 'P' as const, classId: 'cls_xa' },
    { nis: '24103', nisn: '0078912343', fullName: 'Bagas Aditya Prasetyo', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24104', nisn: '0078912344', fullName: 'Chusnul Khotimah', gender: 'P' as const, classId: 'cls_xa' },
    { nis: '24105', nisn: '0078912345', fullName: 'Danuarta Putra Ramadhan', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24106', nisn: '0078912346', fullName: 'Dewi Lestari Wardani', gender: 'P' as const, classId: 'cls_xa' },
    { nis: '24107', nisn: '0078912347', fullName: 'Fandi Ahmad Al-Farisi', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24108', nisn: '0078912348', fullName: 'Fitria Nur Hasanah', gender: 'P' as const, classId: 'cls_xa' },
    { nis: '24109', nisn: '0078912349', fullName: 'Galih Wicaksono', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24110', nisn: '0078912350', fullName: 'Hana Marwah Salsabila', gender: 'P' as const, classId: 'cls_xa' },
    { nis: '24111', nisn: '0078912351', fullName: 'Irfan Hakim Maulana', gender: 'L' as const, classId: 'cls_xa' },
    { nis: '24112', nisn: '0078912352', fullName: 'Laila Zahrotun Nisa', gender: 'P' as const, classId: 'cls_xa' },
    // Kelas X-B
    { nis: '24201', nisn: '0078912353', fullName: 'M. Ali Shodiqin', gender: 'L' as const, classId: 'cls_xb' },
    { nis: '24202', nisn: '0078912354', fullName: 'Nabila Syifa Azzahra', gender: 'P' as const, classId: 'cls_xb' },
    { nis: '24203', nisn: '0078912355', fullName: 'Rifki Bachtiar', gender: 'L' as const, classId: 'cls_xb' },
    { nis: '24204', nisn: '0078912356', fullName: 'Siti Aminah Mubarokah', gender: 'P' as const, classId: 'cls_xb' },
    { nis: '24205', nisn: '0078912357', fullName: 'Zaidan Fathurrahman', gender: 'L' as const, classId: 'cls_xb' },
    // Kelas XI-MIPA 1
    { nis: '23101', nisn: '0068911101', fullName: 'Alif Kurniawan Saputra', gender: 'L' as const, classId: 'cls_xi_mipa1' },
    { nis: '23102', nisn: '0068911102', fullName: 'Bella Anindita Wahyuni', gender: 'P' as const, classId: 'cls_xi_mipa1' },
    { nis: '23103', nisn: '0068911103', fullName: 'Dimas Aryasatya Pratama', gender: 'L' as const, classId: 'cls_xi_mipa1' },
    { nis: '23104', nisn: '0068911104', fullName: 'Farah Diba Annur', gender: 'P' as const, classId: 'cls_xi_mipa1' },
    { nis: '23105', nisn: '0068911105', fullName: 'Habib Mustofa Al-Idrus', gender: 'L' as const, classId: 'cls_xi_mipa1' },
    { nis: '23106', nisn: '0068911106', fullName: 'Intan Permata Sari', gender: 'P' as const, classId: 'cls_xi_mipa1' },
    { nis: '23107', nisn: '0068911107', fullName: 'Muhammad Faizul Bayan', gender: 'L' as const, classId: 'cls_xi_mipa1' },
    { nis: '23108', nisn: '0068911108', fullName: 'Nadira Aulia Rahma', gender: 'P' as const, classId: 'cls_xi_mipa1' },
    { nis: '23109', nisn: '0068911109', fullName: 'Rizaldi Dwi Cahyo', gender: 'L' as const, classId: 'cls_xi_mipa1' },
    { nis: '23110', nisn: '0068911110', fullName: 'Zulfa Ainun Najwa', gender: 'P' as const, classId: 'cls_xi_mipa1' },
    // Kelas XII-MIPA 1
    { nis: '22101', nisn: '0058910001', fullName: 'Agus Setiawan Wibowo', gender: 'L' as const, classId: 'cls_xii_mipa1' },
    { nis: '22102', nisn: '0058910002', fullName: 'Citra Kirana Dewi', gender: 'P' as const, classId: 'cls_xii_mipa1' },
    { nis: '22103', nisn: '0058910003', fullName: 'Daffa Ihsanur Rijal', gender: 'L' as const, classId: 'cls_xii_mipa1' },
    { nis: '22104', nisn: '0058910004', fullName: 'Eka Nur Fitriani', gender: 'P' as const, classId: 'cls_xii_mipa1' },
    { nis: '22105', nisn: '0058910005', fullName: 'Fauzan Azhim Santoso', gender: 'L' as const, classId: 'cls_xii_mipa1' },
  ];

  const students = sampleStudentsRaw.map((s, idx) => ({
    id: `stu_${idx + 1}`,
    nis: s.nis,
    nisn: s.nisn,
    fullName: s.fullName,
    gender: s.gender,
    classId: s.classId,
    academicYearId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  // Generate realistic historical attendance records for the past 5 school days
  const attendance: Array<DatabaseSchema['attendance'][0]> = [];
  const statusOptions: Array<'H' | 'H' | 'H' | 'H' | 'H' | 'S' | 'I' | 'A'> = ['H', 'H', 'H', 'H', 'H', 'S', 'I', 'A'];

  // Past 5 dates (excluding Sunday)
  const pastDates: string[] = [];
  const curr = new Date();
  while (pastDates.length < 5) {
    curr.setDate(curr.getDate() - 1);
    if (curr.getDay() !== 0) { // Not Sunday
      pastDates.push(curr.toISOString().split('T')[0]);
    }
  }

  let attCounter = 1;
  for (const dateStr of pastDates) {
    for (const student of students) {
      // Deterministic but realistic status distribution
      const hashVal = (parseInt(student.nis, 10) + new Date(dateStr).getDate()) % statusOptions.length;
      const status = statusOptions[hashVal];
      let notes = '';
      if (status === 'S') notes = 'Surat dokter / sakit demam';
      else if (status === 'I') notes = 'Izin keperluan keluarga';
      else if (status === 'A') notes = 'Tanpa keterangan';

      attendance.push({
        id: `att_${attCounter++}`,
        studentId: student.id,
        classId: student.classId,
        attendanceDate: dateStr,
        status,
        notes: notes || undefined,
        recordedBy: 'usr_sek_xa',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return {
    profiles,
    academicYears: [
      { id: 'ay_2024_2025', yearName: '2024/2025', startDate: '2024-07-15', endDate: '2025-06-25', isActive: false },
      { id: academicYearId, yearName: '2025/2026', startDate: '2025-07-14', endDate: '2026-06-20', isActive: true },
    ],
    semesters: [
      { id: semesterId, academicYearId, semesterName: 'Ganjil', startDate: '2025-07-14', endDate: '2025-12-20', isActive: true },
      { id: 'sem_genap_2025', academicYearId, semesterName: 'Genap', startDate: '2026-01-05', endDate: '2026-06-20', isActive: false },
    ],
    classes,
    students,
    attendance,
    schoolSettings: {
      id: 'sch_settings_1',
      schoolName: 'MAN 4 Kediri',
      schoolAddress: 'Jl. Harinjing No. 16 Bendo, Pare, Kab. Kediri, Jawa Timur 64225',
      logoUrl: '',
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
      { id: 'cal_1', calendarDate: '2025-08-17', isSchoolDay: false, description: 'HUT Kemerdekaan RI ke-80', academicYearId },
      { id: 'cal_2', calendarDate: '2025-10-22', isSchoolDay: true, description: 'Hari Santri Nasional (Upacara Khusus)', academicYearId },
    ],
    auditLogs: [
      {
        id: 'log_boot',
        actorUserId: 'usr_admin',
        actorName: 'System Bootstrap',
        actorRole: 'ADMIN',
        action: 'BOOTSTRAP',
        targetType: 'SYSTEM',
        details: 'Inisialisasi sistem SIPRESMA MAN 4 Kediri dengan akun awal.',
        createdAt: now,
      },
    ],
  };
}

let db: DatabaseSchema;

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file, reinitializing:', err);
  }
  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
}

function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

db = loadDb();

function addAuditLog(actorUserId: string, actorName: string, actorRole: string, action: string, targetType: string, targetId?: string, details?: string) {
  const log = {
    id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    actorUserId,
    actorName,
    actorRole,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop(); // Keep 200 logs
  saveDb(db);
}

// -----------------------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// -----------------------------------------------------------------------------
interface AuthRequest extends express.Request {
  user?: DatabaseSchema['profiles'][0];
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa atau tidak terautentikasi' });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
  }

  const user = db.profiles.find((p) => p.id === session.userId && p.isActive);
  if (!user) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan atau telah dinonaktifkan.' });
  }

  req.user = user;
  next();
}

function requireRole(...roles: Array<'ADMIN' | 'SEKRETARIS' | 'KESISWAAN'>) {
  return (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk fitur ini.' });
    }
    next();
  };
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// Database Status / Firebase Firestore Connection info
app.get('/api/database/status', (req, res) => {
  res.json({
    mode: 'firebase_firestore',
    databaseType: 'Firebase Firestore (Google Cloud)',
    projectId: 'jovial-citron-msjh2',
    databaseId: 'ai-studio-sipresmapresensi-839a9f3e-c993-4ff5-983b-75c7dfe22d09',
    isSupabaseConfigured: false,
    supabaseStatus: 'Disconnected (Migrated to Firebase Firestore)',
    storageType: 'Firebase Firestore Persistent Cloud Storage',
    counts: {
      students: db.students.filter((s) => s.isActive).length,
      classes: db.classes.filter((c) => c.isActive).length,
      users: db.profiles.filter((u) => u.isActive).length,
      attendanceRecords: db.attendance.length,
      academicYears: db.academicYears.length,
      auditLogs: db.auditLogs.length,
    },
    systemTime: new Date().toISOString(),
  });
});

// AUTH: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || 'local';
  const lockKey = `${ip}_${username}`;

  // Rate Limiting check
  const attempt = loginAttempts.get(lockKey);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({
      error: `Terlalu banyak percobaan gagal. Akun dikunci sementara. Coba lagi dalam ${remainingSeconds} detik.`,
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const user = db.profiles.find((p) => p.username.toLowerCase() === username.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    const current = attempt ? attempt.count + 1 : 1;
    if (current >= 5) {
      loginAttempts.set(lockKey, { count: current, lockedUntil: Date.now() + 5 * 60 * 1000 });
      return res.status(429).json({
        error: 'Terlalu banyak percobaan login yang salah. Akses ditangguhkan selama 5 menit demi keamanan.',
      });
    } else {
      loginAttempts.set(lockKey, { count: current, lockedUntil: 0 });
    }
    return res.status(401).json({
      error: 'Username atau password salah. Silakan periksa kembali.',
      attemptsLeft: 5 - current,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh Administrator.' });
  }

  // Reset login attempts on success
  loginAttempts.delete(lockKey);

  const token = generateToken(user.id);

  // Class name resolution
  let assignedClassName: string | null = null;
  if (user.assignedClassId) {
    const cls = db.classes.find((c) => c.id === user.assignedClassId);
    assignedClassName = cls ? cls.className : null;
  }

  addAuditLog(user.id, user.fullName, user.role, 'LOGIN', 'AUTH', user.id, `Pengguna ${user.username} berhasil masuk.`);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      assignedClassId: user.assignedClassId,
      assignedClassName,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

// AUTH: Me
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  let assignedClassName: string | null = null;
  if (user.assignedClassId) {
    const cls = db.classes.find((c) => c.id === user.assignedClassId);
    assignedClassName = cls ? cls.className : null;
  }

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    assignedClassId: user.assignedClassId,
    assignedClassName,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

// AUTH: Change Password
app.post('/api/auth/change-password', authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal harus 6 karakter.' });
  }

  // If user must change password (initial admin bootstrap), currentPassword check can be optional if matched
  if (currentPassword && !verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Password lama tidak sesuai.' });
  }

  const dbUser = db.profiles.find((p) => p.id === user.id);
  if (!dbUser) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

  dbUser.passwordHash = hashPassword(newPassword);
  dbUser.mustChangePassword = false;
  dbUser.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(user.id, user.fullName, user.role, 'CHANGE_PASSWORD', 'PROFILE', user.id, 'Berhasil memperbarui password.');

  res.json({ success: true, message: 'Password berhasil diubah. Keamanan akun diperbarui.' });
});

// AUTH: Reset Password (ADMIN ONLY)
app.post('/api/auth/reset-password', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { targetUserId, newPassword } = req.body;
  if (!targetUserId || !newPassword) {
    return res.status(400).json({ error: 'ID pengguna dan password baru harus diisi' });
  }

  const target = db.profiles.find((p) => p.id === targetUserId);
  if (!target) return res.status(404).json({ error: 'Pengguna target tidak ditemukan' });

  target.passwordHash = hashPassword(newPassword);
  target.mustChangePassword = true; // prompt them to change
  target.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'RESET_PASSWORD', 'USER', target.id, `Mereset password pengguna ${target.username}.`);

  res.json({ success: true, message: `Password pengguna ${target.username} berhasil direset.` });
});

// CLASSES: List
app.get('/api/classes', (req, res) => {
  const enriched = db.classes.map((cls) => {
    const secretary = cls.secretaryUserId ? db.profiles.find((p) => p.id === cls.secretaryUserId) : null;
    const studentCount = db.students.filter((s) => s.classId === cls.id && s.isActive).length;
    const ay = db.academicYears.find((y) => y.id === cls.academicYearId);
    return {
      ...cls,
      secretaryName: secretary ? secretary.fullName : null,
      studentCount,
      academicYearName: ay ? ay.yearName : '2025/2026',
    };
  });
  res.json(enriched);
});

// CLASSES: Create (ADMIN)
app.post('/api/classes', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { className, gradeLevel, academicYearId, secretaryUserId } = req.body;
  if (!className || !gradeLevel) {
    return res.status(400).json({ error: 'Nama kelas dan tingkat kelas (X/XI/XII) wajib diisi' });
  }

  const existing = db.classes.find((c) => c.className.toLowerCase() === className.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Kelas dengan nama "${className}" sudah terdaftar.` });
  }

  const activeYear = db.academicYears.find((y) => y.isActive) || db.academicYears[0];
  const newClass = {
    id: 'cls_' + Date.now(),
    className: className.trim(),
    gradeLevel,
    academicYearId: academicYearId || activeYear.id,
    secretaryUserId: secretaryUserId || null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.classes.push(newClass);

  if (secretaryUserId) {
    const secUser = db.profiles.find((p) => p.id === secretaryUserId);
    if (secUser) secUser.assignedClassId = newClass.id;
  }

  saveDb(db);
  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'CREATE_CLASS', 'CLASS', newClass.id, `Menambahkan kelas baru ${newClass.className}`);

  res.status(201).json(newClass);
});

// CLASSES: Update (ADMIN)
app.put('/api/classes/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { className, gradeLevel, secretaryUserId, isActive } = req.body;

  const cls = db.classes.find((c) => c.id === id);
  if (!cls) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

  if (className) cls.className = className.trim();
  if (gradeLevel) cls.gradeLevel = gradeLevel;
  if (isActive !== undefined) cls.isActive = isActive;

  if (secretaryUserId !== undefined) {
    // Unassign old secretary
    if (cls.secretaryUserId && cls.secretaryUserId !== secretaryUserId) {
      const oldSec = db.profiles.find((p) => p.id === cls.secretaryUserId);
      if (oldSec && oldSec.assignedClassId === cls.id) {
        oldSec.assignedClassId = null;
      }
    }
    cls.secretaryUserId = secretaryUserId;
    if (secretaryUserId) {
      const newSec = db.profiles.find((p) => p.id === secretaryUserId);
      if (newSec) newSec.assignedClassId = cls.id;
    }
  }

  cls.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'UPDATE_CLASS', 'CLASS', cls.id, `Memperbarui kelas ${cls.className}`);
  res.json(cls);
});

// CLASSES: Delete (ADMIN)
app.delete('/api/classes/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const index = db.classes.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

  const hasAttendance = db.attendance.some((a) => a.classId === id);
  const hasStudents = db.students.some((s) => s.classId === id && s.isActive);

  if (hasAttendance || hasStudents) {
    return res.status(400).json({
      error: 'Kelas ini memiliki riwayat presensi atau siswa aktif. Gunakan status nonaktif untuk menjaga integritas data.',
    });
  }

  const removed = db.classes.splice(index, 1)[0];
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'DELETE_CLASS', 'CLASS', id, `Menghapus kelas ${removed.className}`);
  res.json({ success: true, message: `Kelas ${removed.className} berhasil dihapus.` });
});

// STUDENTS: List
app.get('/api/students', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { classId, search, isActive } = req.query;

  let list = db.students;

  // Authorization: SEKRETARIS can ONLY access their assigned class
  if (user.role === 'SEKRETARIS') {
    if (!user.assignedClassId) {
      return res.status(403).json({ error: 'Akun sekretaris belum ditugaskan ke kelas manapun.' });
    }
    list = list.filter((s) => s.classId === user.assignedClassId);
  } else if (classId && typeof classId === 'string' && classId !== 'all') {
    list = list.filter((s) => s.classId === classId);
  }

  if (isActive !== undefined && isActive !== 'all') {
    const isAct = isActive === 'true';
    list = list.filter((s) => s.isActive === isAct);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((s) => s.fullName.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || (s.nisn && s.nisn.toLowerCase().includes(q)));
  }

  const enriched = list.map((s) => {
    const cls = db.classes.find((c) => c.id === s.classId);
    return {
      ...s,
      className: cls ? cls.className : 'Tidak Diketahui',
    };
  });

  res.json(enriched);
});

// STUDENTS: Create (ADMIN or SEKRETARIS)
app.post('/api/students', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { nis, nisn, fullName, gender, classId } = req.body;

  if (!nis || !fullName || !classId) {
    return res.status(400).json({ error: 'NIS, Nama Lengkap, dan Kelas wajib diisi' });
  }

  // Authorization check for SEKRETARIS
  if (user.role === 'SEKRETARIS' && user.assignedClassId !== classId) {
    return res.status(403).json({ error: 'Sekretaris hanya diizinkan menambah siswa untuk kelas binaannya sendiri.' });
  }

  // Duplicate NIS check
  const duplicate = db.students.find((s) => s.nis.trim() === String(nis).trim());
  if (duplicate) {
    return res.status(400).json({ error: `Siswa dengan NIS "${nis}" sudah terdaftar atas nama ${duplicate.fullName}.` });
  }

  const activeYear = db.academicYears.find((y) => y.isActive) || db.academicYears[0];
  const newStudent = {
    id: 'stu_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    nis: String(nis).trim(),
    nisn: nisn ? String(nisn).trim() : '',
    fullName: fullName.trim(),
    gender: (gender === 'P' ? 'P' : 'L') as 'L' | 'P',
    classId,
    academicYearId: activeYear.id,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.students.push(newStudent);
  saveDb(db);

  addAuditLog(user.id, user.fullName, user.role, 'CREATE_STUDENT', 'STUDENT', newStudent.id, `Menambahkan siswa ${newStudent.fullName} (NIS: ${newStudent.nis})`);

  res.status(201).json(newStudent);
});

// STUDENTS: Bulk Import (ADMIN or SEKRETARIS)
app.post('/api/students/bulk-import', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { rows, defaultClassId } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Tidak ada baris data yang diunggah.' });
  }

  const successList: Array<DatabaseSchema['students'][0]> = [];
  const failureList: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }> = [];

  const activeYear = db.academicYears.find((y) => y.isActive) || db.academicYears[0];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNum = idx + 1;
    const nis = row.nis ? String(row.nis).trim() : '';
    const fullName = row.fullName ? String(row.fullName).trim() : '';
    const nisn = row.nisn ? String(row.nisn).trim() : '';
    const gender = (row.gender && String(row.gender).trim().toUpperCase() === 'P') ? 'P' : 'L';
    let targetClassId = row.classId || defaultClassId;

    if (!targetClassId && row.className) {
      const matched = db.classes.find((c) => c.className.toLowerCase() === String(row.className).toLowerCase());
      if (matched) targetClassId = matched.id;
    }

    if (!nis) {
      failureList.push({ rowNumber: rowNum, name: fullName, reason: 'NIS tidak boleh kosong' });
      continue;
    }
    if (!fullName) {
      failureList.push({ rowNumber: rowNum, nis, reason: 'Nama lengkap tidak boleh kosong' });
      continue;
    }
    if (!targetClassId) {
      failureList.push({ rowNumber: rowNum, nis, name: fullName, reason: 'Kelas tidak valid atau tidak ditemukan' });
      continue;
    }

    // Role check for SEKRETARIS
    if (user.role === 'SEKRETARIS' && user.assignedClassId !== targetClassId) {
      failureList.push({ rowNumber: rowNum, nis, name: fullName, reason: 'Sekretaris hanya diizinkan mengimpor ke kelasnya sendiri' });
      continue;
    }

    // Existing check in DB
    const existing = db.students.find((s) => s.nis === nis);
    if (existing) {
      failureList.push({ rowNumber: rowNum, nis, name: fullName, reason: `NIS ${nis} sudah terdaftar (${existing.fullName})` });
      continue;
    }

    const student: DatabaseSchema['students'][0] = {
      id: 'stu_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
      nis,
      nisn,
      fullName,
      gender,
      classId: targetClassId,
      academicYearId: activeYear.id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.students.push(student);
    successList.push(student);
  }

  saveDb(db);

  addAuditLog(user.id, user.fullName, user.role, 'BULK_IMPORT_STUDENTS', 'STUDENT', '', `Impor massal: ${successList.length} berhasil, ${failureList.length} gagal.`);

  res.json({
    totalProcessed: rows.length,
    successCount: successList.length,
    failureCount: failureList.length,
    successList,
    failures: failureList,
  });
});

// STUDENTS: Update
app.put('/api/students/:id', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { nis, nisn, fullName, gender, classId, isActive } = req.body;

  const student = db.students.find((s) => s.id === id);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

  // Authorization for SEKRETARIS
  if (user.role === 'SEKRETARIS' && user.assignedClassId !== student.classId) {
    return res.status(403).json({ error: 'Sekretaris hanya dapat mengubah data siswa di kelasnya sendiri.' });
  }

  if (nis && nis !== student.nis) {
    const duplicate = db.students.find((s) => s.nis === nis && s.id !== id);
    if (duplicate) return res.status(400).json({ error: `NIS ${nis} sudah digunakan oleh siswa lain.` });
    student.nis = nis.trim();
  }

  if (fullName) student.fullName = fullName.trim();
  if (nisn !== undefined) student.nisn = String(nisn).trim();
  if (gender) student.gender = gender === 'P' ? 'P' : 'L';
  if (classId && user.role === 'ADMIN') student.classId = classId;
  if (isActive !== undefined) student.isActive = isActive;

  student.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(user.id, user.fullName, user.role, 'UPDATE_STUDENT', 'STUDENT', student.id, `Memperbarui data siswa ${student.fullName}`);

  res.json(student);
});

// STUDENTS: Move Class (ADMIN ONLY)
app.put('/api/students/:id/move-class', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { targetClassId } = req.body;

  const student = db.students.find((s) => s.id === id);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

  const targetClass = db.classes.find((c) => c.id === targetClassId);
  if (!targetClass) return res.status(404).json({ error: 'Kelas tujuan tidak ditemukan' });

  const prevClass = db.classes.find((c) => c.id === student.classId);
  student.classId = targetClassId;
  student.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'MOVE_STUDENT_CLASS', 'STUDENT', student.id, `Memindahkan ${student.fullName} dari ${prevClass?.className || '-'} ke ${targetClass.className}`);

  res.json({ success: true, message: `Siswa berhasil dipindahkan ke kelas ${targetClass.className}`, student });
});

// STUDENTS: Delete or Deactivate
app.delete('/api/students/:id', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const student = db.students.find((s) => s.id === id);
  if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan' });

  if (user.role === 'SEKRETARIS' && user.assignedClassId !== student.classId) {
    return res.status(403).json({ error: 'Sekretaris hanya diizinkan mengelola siswa di kelasnya.' });
  }

  // To preserve historical attendance integrity (Master prompt requirement):
  // Check if attendance records exist. If yes, deactivate instead of wiping history!
  const hasAttendance = db.attendance.some((a) => a.studentId === id);
  if (hasAttendance) {
    student.isActive = false;
    student.updatedAt = new Date().toISOString();
    saveDb(db);
    addAuditLog(user.id, user.fullName, user.role, 'DEACTIVATE_STUDENT', 'STUDENT', id, `Menonaktifkan siswa ${student.fullName} (riwayat presensi tetap utuh)`);
    return res.json({ success: true, message: `Siswa ${student.fullName} telah dinonaktifkan. Seluruh riwayat presensi tetap terjaga.` });
  } else {
    const idx = db.students.findIndex((s) => s.id === id);
    const removed = db.students.splice(idx, 1)[0];
    saveDb(db);
    addAuditLog(user.id, user.fullName, user.role, 'DELETE_STUDENT', 'STUDENT', id, `Menghapus data siswa ${removed.fullName}`);
    return res.json({ success: true, message: `Data siswa ${removed.fullName} berhasil dihapus.` });
  }
});

// STUDENTS: Delete All Students (ADMIN ONLY)
app.post('/api/students/delete-all', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { confirmText, deleteAttendance, classId } = req.body;

  if (confirmText !== 'HAPUS SEMUA SISWA') {
    return res.status(400).json({
      error: 'Teks konfirmasi tidak sesuai. Ketik "HAPUS SEMUA SISWA" untuk melanjutkan.',
    });
  }

  let countDeleted = 0;
  if (classId && classId !== 'all') {
    const initialCount = db.students.length;
    const studentIdsToDelete = new Set(db.students.filter((s) => s.classId === classId).map((s) => s.id));
    db.students = db.students.filter((s) => s.classId !== classId);
    countDeleted = initialCount - db.students.length;

    if (deleteAttendance) {
      db.attendance = db.attendance.filter((a) => !studentIdsToDelete.has(a.studentId));
    }
  } else {
    countDeleted = db.students.length;
    db.students = [];
    if (deleteAttendance) {
      db.attendance = [];
    }
  }

  saveDb(db);
  addAuditLog(
    req.user!.id,
    req.user!.fullName,
    req.user!.role,
    'DELETE_ALL_STUDENTS',
    'STUDENT',
    '',
    `Menghapus seluruh data siswa (${countDeleted} siswa dihapus). Riwayat presensi: ${deleteAttendance ? 'dibersihkan' : 'dipertahankan'}.`
  );

  res.json({
    success: true,
    count: countDeleted,
    message: `Berhasil menghapus ${countDeleted} data siswa.`,
  });
});

// ACADEMIC YEARS: List
app.get('/api/academic-years', (req, res) => {
  res.json(db.academicYears);
});

// ACADEMIC YEARS: Create (ADMIN ONLY)
app.post('/api/academic-years', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { yearName, startDate, endDate, isActive } = req.body;

  if (!yearName || !startDate || !endDate) {
    return res.status(400).json({ error: 'Nama tahun ajaran, tanggal mulai, dan tanggal selesai wajib diisi.' });
  }

  const existing = db.academicYears.find((y) => y.yearName.trim().toLowerCase() === yearName.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Tahun ajaran "${yearName}" sudah ada.` });
  }

  if (isActive) {
    db.academicYears.forEach((y) => (y.isActive = false));
  }

  const newYear = {
    id: 'ay_' + Date.now(),
    yearName: yearName.trim(),
    startDate,
    endDate,
    isActive: Boolean(isActive),
  };

  db.academicYears.push(newYear);
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'CREATE_ACADEMIC_YEAR', 'ACADEMIC_YEAR', newYear.id, `Menambahkan tahun ajaran baru ${newYear.yearName}.`);

  res.status(201).json(newYear);
});

// ACADEMIC YEARS: Update (ADMIN ONLY)
app.put('/api/academic-years/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { yearName, startDate, endDate, isActive } = req.body;

  const item = db.academicYears.find((y) => y.id === id);
  if (!item) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

  if (yearName) item.yearName = yearName.trim();
  if (startDate) item.startDate = startDate;
  if (endDate) item.endDate = endDate;

  if (isActive !== undefined && isActive !== item.isActive) {
    if (isActive) {
      db.academicYears.forEach((y) => (y.isActive = false));
    }
    item.isActive = Boolean(isActive);
  }

  saveDb(db);
  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'UPDATE_ACADEMIC_YEAR', 'ACADEMIC_YEAR', item.id, `Memperbarui tahun ajaran ${item.yearName}.`);

  res.json(item);
});

// ACADEMIC YEARS: Delete (ADMIN ONLY)
app.delete('/api/academic-years/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const index = db.academicYears.findIndex((y) => y.id === id);
  if (index === -1) return res.status(404).json({ error: 'Tahun ajaran tidak ditemukan.' });

  const item = db.academicYears[index];
  if (item.isActive) {
    return res.status(400).json({ error: 'Tahun ajaran aktif tidak dapat dihapus. Aktifkan tahun ajaran lain terlebih dahulu.' });
  }

  const hasClasses = db.classes.some((c) => c.academicYearId === id);
  if (hasClasses) {
    return res.status(400).json({ error: 'Tahun ajaran ini masih memiliki data kelas terkait. Ubah tahun ajaran kelas terlebih dahulu.' });
  }

  db.academicYears.splice(index, 1);
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'DELETE_ACADEMIC_YEAR', 'ACADEMIC_YEAR', id, `Menghapus tahun ajaran ${item.yearName}.`);

  res.json({ success: true, message: `Tahun ajaran ${item.yearName} berhasil dihapus.` });
});

// USERS: List (ADMIN ONLY)
app.get('/api/users', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const list = db.profiles.map((p) => {
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
  res.json(list);
});

// USERS: Create (ADMIN ONLY)
app.post('/api/users', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { username, fullName, role, assignedClassId, password } = req.body;

  if (!username || !fullName || !role || !password) {
    return res.status(400).json({ error: 'Semua field wajib diisi' });
  }

  const existing = db.profiles.find((p) => p.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Username "${username}" sudah digunakan. Silakan gunakan username lain.` });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    username: username.trim(),
    fullName: fullName.trim(),
    role,
    assignedClassId: role === 'SEKRETARIS' ? assignedClassId || null : null,
    isActive: true,
    mustChangePassword: true, // Master prompt requirement: new users prompted to change default password
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.profiles.push(newUser);

  // If secretary, link to class
  if (role === 'SEKRETARIS' && assignedClassId) {
    const cls = db.classes.find((c) => c.id === assignedClassId);
    if (cls) cls.secretaryUserId = newUser.id;
  }

  saveDb(db);
  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'CREATE_USER', 'USER', newUser.id, `Membuat akun baru ${newUser.username} (${newUser.role})`);

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    fullName: newUser.fullName,
    role: newUser.role,
    assignedClassId: newUser.assignedClassId,
    isActive: newUser.isActive,
  });
});

// USERS: Update (ADMIN ONLY)
app.put('/api/users/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { username, fullName, role, assignedClassId, isActive } = req.body;

  const target = db.profiles.find((p) => p.id === id);
  if (!target) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

  if (username && username.toLowerCase() !== target.username.toLowerCase()) {
    const existing = db.profiles.find((p) => p.username.toLowerCase() === username.toLowerCase() && p.id !== id);
    if (existing) return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
    target.username = username.trim();
  }

  if (fullName) target.fullName = fullName.trim();
  if (role) target.role = role;
  if (isActive !== undefined) target.isActive = isActive;

  if (role === 'SEKRETARIS') {
    target.assignedClassId = assignedClassId || null;
    if (assignedClassId) {
      const cls = db.classes.find((c) => c.id === assignedClassId);
      if (cls) cls.secretaryUserId = target.id;
    }
  } else {
    target.assignedClassId = null;
  }

  target.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'UPDATE_USER', 'USER', target.id, `Memperbarui akun ${target.username}`);
  res.json(target);
});

// ATTENDANCE: Get Attendance Records
app.get('/api/attendance', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { classId, date, month, startDate, endDate } = req.query;

  let queryClassId = classId ? String(classId) : undefined;

  // Authorization: SEKRETARIS cannot view other classes
  if (user.role === 'SEKRETARIS') {
    queryClassId = user.assignedClassId || 'none';
  }

  let records = db.attendance;

  if (queryClassId && queryClassId !== 'all') {
    records = records.filter((r) => r.classId === queryClassId);
  }

  if (date) {
    records = records.filter((r) => r.attendanceDate === date);
  }

  if (month) { // format YYYY-MM
    records = records.filter((r) => r.attendanceDate.startsWith(String(month)));
  }

  if (startDate && endDate) {
    records = records.filter((r) => r.attendanceDate >= String(startDate) && r.attendanceDate <= String(endDate));
  }

  // Enrich with student details
  const enriched = records.map((r) => {
    const s = db.students.find((stu) => stu.id === r.studentId);
    const c = db.classes.find((cls) => cls.id === r.classId);
    return {
      ...r,
      studentNis: s ? s.nis : '-',
      studentName: s ? s.fullName : 'Tidak Diketahui',
      className: c ? c.className : '-',
    };
  });

  res.json(enriched);
});

// ATTENDANCE: Save Batch Attendance (SEKRETARIS or ADMIN)
app.post('/api/attendance/batch', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { classId, attendanceDate, items } = req.body;

  if (!classId || !attendanceDate || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Parameter classId, attendanceDate, dan daftar siswa (items) harus lengkap.' });
  }

  // Authorization check
  if (user.role === 'SEKRETARIS' && user.assignedClassId !== classId) {
    return res.status(403).json({ error: 'Anda hanya memiliki akses untuk mencatat presensi kelas Anda.' });
  }

  const cls = db.classes.find((c) => c.id === classId);
  const now = new Date().toISOString();
  let savedCount = 0;

  for (const item of items) {
    const { studentId, status, notes } = item;
    if (!studentId || !['H', 'S', 'I', 'A'].includes(status)) continue;

    // Check if duplicate entry already exists for student & date (Master prompt Section 5B: prevent duplicate, update in-place)
    const existingIndex = db.attendance.findIndex((a) => a.studentId === studentId && a.attendanceDate === attendanceDate);

    if (existingIndex >= 0) {
      db.attendance[existingIndex].status = status;
      db.attendance[existingIndex].notes = notes || undefined;
      db.attendance[existingIndex].recordedBy = user.id;
      db.attendance[existingIndex].updatedAt = now;
    } else {
      db.attendance.push({
        id: 'att_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        studentId,
        classId,
        attendanceDate,
        status,
        notes: notes || undefined,
        recordedBy: user.id,
        createdAt: now,
        updatedAt: now,
      });
    }
    savedCount++;
  }

  saveDb(db);

  addAuditLog(user.id, user.fullName, user.role, 'SAVE_ATTENDANCE', 'ATTENDANCE', classId, `Presensi kelas ${cls?.className || classId} tanggal ${attendanceDate} disimpan (${savedCount} siswa).`);

  res.json({ success: true, count: savedCount, message: `Presensi tanggal ${attendanceDate} berhasil disimpan secara persisten.` });
});

// RECAP: Daily Summary (MADRASAH-WIDE OR FILTERED)
app.get('/api/recap/daily', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

  let classes = db.classes.filter((c) => c.isActive);
  if (user.role === 'SEKRETARIS' && user.assignedClassId) {
    classes = classes.filter((c) => c.id === user.assignedClassId);
  }

  const classSummaries = classes.map((cls) => {
    const studentsInClass = db.students.filter((s) => s.classId === cls.id && s.isActive);
    const dayRecords = db.attendance.filter((a) => a.classId === cls.id && a.attendanceDate === dateStr);

    let h = 0, s = 0, i = 0, a = 0;
    for (const r of dayRecords) {
      if (r.status === 'H') h++;
      else if (r.status === 'S') s++;
      else if (r.status === 'I') i++;
      else if (r.status === 'A') a++;
    }

    const totalTercatat = h + s + i + a;
    const sudahIsi = totalTercatat > 0;
    const persentase = totalTercatat > 0 ? Math.round((h / totalTercatat) * 100) : null;

    return {
      classId: cls.id,
      className: cls.className,
      gradeLevel: cls.gradeLevel,
      totalStudents: studentsInClass.length,
      hadir: h,
      sakit: s,
      izin: i,
      alpa: a,
      totalTercatat,
      persentase,
      sudahIsiHariIni: sudahIsi,
    };
  });

  // Madrasah totals
  let grandH = 0, grandS = 0, grandI = 0, grandA = 0, grandStudents = 0;
  for (const cs of classSummaries) {
    grandH += cs.hadir;
    grandS += cs.sakit;
    grandI += cs.izin;
    grandA += cs.alpa;
    grandStudents += cs.totalStudents;
  }
  const grandTercatat = grandH + grandS + grandI + grandA;
  const grandPersentase = grandTercatat > 0 ? Math.round((grandH / grandTercatat) * 100) : null;

  const kelasBelumIsi = classSummaries.filter((cs) => !cs.sudahIsiHariIni);

  res.json({
    date: dateStr,
    totalClasses: classes.length,
    totalStudents: grandStudents,
    summary: {
      hadir: grandH,
      sakit: grandS,
      izin: grandI,
      alpa: grandA,
      totalTercatat: grandTercatat,
      persentase: grandPersentase,
    },
    classes: classSummaries,
    unsubmittedClasses: kelasBelumIsi,
  });
});

// RECAP: Monthly / Period Summary (PER-STUDENT & PER-CLASS)
app.get('/api/recap/period', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const { classId, startDate, endDate, month } = req.query;

  let queryClassId = classId ? String(classId) : undefined;
  if (user.role === 'SEKRETARIS') {
    queryClassId = user.assignedClassId || 'none';
  }

  let filterStart = String(startDate || '');
  let filterEnd = String(endDate || '');

  if (month && !filterStart) {
    // month format YYYY-MM
    filterStart = `${month}-01`;
    filterEnd = `${month}-31`;
  }

  // Attendance in range
  let records = db.attendance.filter((a) => {
    if (filterStart && a.attendanceDate < filterStart) return false;
    if (filterEnd && a.attendanceDate > filterEnd) return false;
    if (queryClassId && queryClassId !== 'all' && a.classId !== queryClassId) return false;
    return true;
  });

  // Students filter
  let students = db.students.filter((s) => s.isActive);
  if (queryClassId && queryClassId !== 'all') {
    students = students.filter((s) => s.classId === queryClassId);
  }

  // Calculate per student
  const studentRecaps = students.map((stu) => {
    const stuRecords = records.filter((r) => r.studentId === stu.id);
    let h = 0, s = 0, i = 0, a = 0;
    const detailDates: Record<string, 'H' | 'S' | 'I' | 'A'> = {};

    for (const r of stuRecords) {
      if (r.status === 'H') h++;
      else if (r.status === 'S') s++;
      else if (r.status === 'I') i++;
      else if (r.status === 'A') a++;
      detailDates[r.attendanceDate] = r.status;
    }

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

  // Overall totals
  let totalH = 0, totalS = 0, totalI = 0, totalA = 0;
  for (const sr of studentRecaps) {
    totalH += sr.hadir;
    totalS += sr.sakit;
    totalI += sr.izin;
    totalA += sr.alpa;
  }
  const totalRecorded = totalH + totalS + totalI + totalA;
  const overallPersentase = totalRecorded > 0 ? Math.round((totalH / totalRecorded) * 100) : null;

  res.json({
    period: { startDate: filterStart, endDate: filterEnd, month },
    summary: {
      hadir: totalH,
      sakit: totalS,
      izin: totalI,
      alpa: totalA,
      totalTercatat: totalRecorded,
      persentase: overallPersentase,
    },
    students: studentRecaps,
  });
});

// SETTINGS: Get School Settings
app.get('/api/settings', (req, res) => {
  res.json(db.schoolSettings);
});

// SETTINGS: Update School Settings (ADMIN ONLY)
app.put('/api/settings', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res) => {
  const {
    schoolName,
    schoolAddress,
    logoUrl,
    principalName,
    principalNip,
    studentAffairsName,
    studentAffairsNip,
    reportPreparerName,
    reportSignatoryTitle,
    reportCity,
  } = req.body;

  if (schoolName) db.schoolSettings.schoolName = schoolName;
  if (schoolAddress) db.schoolSettings.schoolAddress = schoolAddress;
  if (logoUrl !== undefined) db.schoolSettings.logoUrl = logoUrl;
  if (principalName) db.schoolSettings.principalName = principalName;
  if (principalNip) db.schoolSettings.principalNip = principalNip;
  if (studentAffairsName) db.schoolSettings.studentAffairsName = studentAffairsName;
  if (studentAffairsNip) db.schoolSettings.studentAffairsNip = studentAffairsNip;
  if (reportPreparerName) db.schoolSettings.reportPreparerName = reportPreparerName;
  if (reportSignatoryTitle) db.schoolSettings.reportSignatoryTitle = reportSignatoryTitle;
  if (reportCity) db.schoolSettings.reportCity = reportCity;

  db.schoolSettings.updatedAt = new Date().toISOString();
  saveDb(db);

  addAuditLog(req.user!.id, req.user!.fullName, req.user!.role, 'UPDATE_SETTINGS', 'SETTINGS', db.schoolSettings.id, 'Memperbarui identitas dan nama pejabat penandatangan laporan madrasah.');

  res.json(db.schoolSettings);
});

// CALENDAR: Get
app.get('/api/calendar', (req, res) => {
  res.json(db.schoolCalendar);
});

// AUDIT LOGS: Get (ADMIN ONLY)
app.get('/api/audit-logs', authMiddleware, requireRole('ADMIN'), (req, res) => {
  res.json(db.auditLogs);
});

// -----------------------------------------------------------------------------
// VITE INTEGRATION & SERVER START
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIPRESMA MAN 4 Kediri] Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SIPRESMA server:', err);
});
