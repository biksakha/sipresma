/**
 * Centralized Firebase Firestore Database Operations for SIPRESMA MAN 4 Kediri
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
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

const initialStudents: Student[] = [
  { id: 'stu_1', nis: '24101', nisn: '0078912341', fullName: 'Achmad Rizky Maulana', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_2', nis: '24102', nisn: '0078912342', fullName: 'Aisyah Putri Rahmadhani', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_3', nis: '24103', nisn: '0078912343', fullName: 'Bagas Aditya Prasetyo', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_4', nis: '24104', nisn: '0078912344', fullName: 'Chusnul Khotimah', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_5', nis: '24105', nisn: '0078912345', fullName: 'Danuarta Putra Ramadhan', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_6', nis: '24106', nisn: '0078912346', fullName: 'Dewi Lestari Wardani', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_7', nis: '24107', nisn: '0078912347', fullName: 'Fandi Ahmad Al-Farisi', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_8', nis: '24108', nisn: '0078912348', fullName: 'Fitria Nur Hasanah', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_9', nis: '24109', nisn: '0078912349', fullName: 'Galih Wicaksono', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_10', nis: '24110', nisn: '0078912350', fullName: 'Hana Marwah Salsabila', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_11', nis: '24111', nisn: '0078912351', fullName: 'Irfan Hakim Maulana', gender: 'L', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_12', nis: '24112', nisn: '0078912352', fullName: 'Laila Zahrotun Nisa', gender: 'P', classId: 'cls_xa', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_13', nis: '24201', nisn: '0078912353', fullName: 'M. Ali Shodiqin', gender: 'L', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_14', nis: '24202', nisn: '0078912354', fullName: 'Nabila Syifa Azzahra', gender: 'P', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_15', nis: '24203', nisn: '0078912355', fullName: 'Rifki Bachtiar', gender: 'L', classId: 'cls_xb', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_16', nis: '23101', nisn: '0068911101', fullName: 'Alif Kurniawan Saputra', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_17', nis: '23102', nisn: '0068911102', fullName: 'Bella Anindita Wahyuni', gender: 'P', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_18', nis: '23103', nisn: '0068911103', fullName: 'Dimas Aryasatya Pratama', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_19', nis: '23104', nisn: '0068911104', fullName: 'Farah Diba Annur', gender: 'P', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'stu_20', nis: '23105', nisn: '0068911105', fullName: 'Habib Mustofa Al-Idrus', gender: 'L', classId: 'cls_xi_mipa1', academicYearId: 'ay_2025_2026', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Auto-seed centralized Firestore database if empty
let isSeeded = false;

export async function ensureFirestoreCentralizedData(): Promise<void> {
  if (isSeeded) return;
  try {
    const now = new Date().toISOString();
    const defaultPasswordHash = await hashPasswordClient('1234');

    // 1. Profiles: Ensure admin exists and has a valid passwordHash
    const adminDoc = await getDoc(doc(db, 'profiles', 'usr_admin'));
    if (!adminDoc.exists()) {
      await setDoc(doc(db, 'profiles', 'usr_admin'), {
        id: 'usr_admin',
        username: 'man4keren',
        fullName: 'Administrator Utama MAN 4 Kediri',
        role: 'ADMIN',
        assignedClassId: null,
        isActive: true,
        mustChangePassword: false,
        passwordHash: defaultPasswordHash,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const data = adminDoc.data();
      if (!data.passwordHash) {
        await updateDoc(doc(db, 'profiles', 'usr_admin'), {
          passwordHash: defaultPasswordHash,
        });
      }
    }

    // 2. Academic Years: Seed if empty
    const aySnap = await getDocs(collection(db, 'academicYears'));
    if (aySnap.empty) {
      const batchAy = writeBatch(db);
      const academicYears: AcademicYear[] = [
        { id: 'ay_2024_2025', yearName: '2024/2025', startDate: '2024-07-15', endDate: '2025-06-25', isActive: false },
        { id: 'ay_2025_2026', yearName: '2025/2026', startDate: '2025-07-14', endDate: '2026-06-20', isActive: true },
        { id: 'ay_2026_2027', yearName: '2026/2027', startDate: '2026-07-13', endDate: '2027-06-19', isActive: false },
      ];
      for (const ay of academicYears) {
        batchAy.set(doc(db, 'academicYears', ay.id), ay);
      }
      await batchAy.commit();
    }

    // 3. Classes: Seed if empty
    const clsSnap = await getDocs(collection(db, 'classes'));
    let didSeedClasses = false;
    if (clsSnap.empty) {
      const batchCls = writeBatch(db);
      const classes: ClassItem[] = [
        { id: 'cls_xa', className: 'X-A', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xa', isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xb', className: 'X-B', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xc', className: 'X-C', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xi_mipa1', className: 'XI-MIPA 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xi1', isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xi_mipa2', className: 'XI-MIPA 2', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xi_ips1', className: 'XI-IPS 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xii_mipa1', className: 'XII-MIPA 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
        { id: 'cls_xii_ips1', className: 'XII-IPS 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
      ];
      for (const c of classes) {
        batchCls.set(doc(db, 'classes', c.id), c);
      }
      await batchCls.commit();
      didSeedClasses = true;
    }

    // 4. Students & Settings initialization check
    const settingsDoc = await getDoc(doc(db, 'schoolSettings', 'main'));
    const isFirstInit = !settingsDoc.exists() || !settingsDoc.data()?.isInitialized;

    if (isFirstInit) {
      const stuSnap = await getDocs(collection(db, 'students'));
      if (stuSnap.empty) {
        const batchStu = writeBatch(db);
        for (const s of initialStudents) {
          batchStu.set(doc(db, 'students', s.id), s);
        }
        await batchStu.commit();
      }
    }

    // 5. School Settings: Seed if empty
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'schoolSettings', 'main'), {
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
        isInitialized: true,
        updatedAt: now,
      });
    } else if (isFirstInit) {
      await updateDoc(doc(db, 'schoolSettings', 'main'), { isInitialized: true });
    }

    isSeeded = true;
  } catch (err) {
    console.warn('Checking Firestore seed:', err);
  }
}

async function seedInitialDataToFirestore(): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const defaultPasswordHash = await hashPasswordClient('1234');

  // 1. Profiles
  const profiles: Array<UserProfile & { passwordHash: string }> = [
    {
      id: 'usr_admin',
      username: 'man4keren',
      fullName: 'Administrator Utama MAN 4 Kediri',
      role: 'ADMIN',
      assignedClassId: null,
      isActive: true,
      mustChangePassword: true,
      passwordHash: defaultPasswordHash,
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
      passwordHash: defaultPasswordHash,
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
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_kesiswaan',
      username: 'kesiswaan',
      fullName: 'Drs. Moh. Zaenal Arifin, M.Pd (Kesiswaan)',
      role: 'KESISWAAN',
      assignedClassId: null,
      isActive: true,
      mustChangePassword: false,
      passwordHash: defaultPasswordHash,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const p of profiles) {
    batch.set(doc(db, 'profiles', p.id), p);
  }

  // 2. Academic Years
  const academicYears: AcademicYear[] = [
    { id: 'ay_2024_2025', yearName: '2024/2025', startDate: '2024-07-15', endDate: '2025-06-25', isActive: false },
    { id: 'ay_2025_2026', yearName: '2025/2026', startDate: '2025-07-14', endDate: '2026-06-20', isActive: true },
    { id: 'ay_2026_2027', yearName: '2026/2027', startDate: '2026-07-13', endDate: '2027-06-19', isActive: false },
  ];
  for (const ay of academicYears) {
    batch.set(doc(db, 'academicYears', ay.id), ay);
  }

  // 3. Classes
  const classes: ClassItem[] = [
    { id: 'cls_xa', className: 'X-A', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xa', isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xb', className: 'X-B', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xc', className: 'X-C', gradeLevel: 'X', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_mipa1', className: 'XI-MIPA 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: 'usr_sek_xi1', isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_mipa2', className: 'XI-MIPA 2', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xi_ips1', className: 'XI-IPS 1', gradeLevel: 'XI', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xii_mipa1', className: 'XII-MIPA 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: 'cls_xii_ips1', className: 'XII-IPS 1', gradeLevel: 'XII', academicYearId: 'ay_2025_2026', secretaryUserId: null, isActive: true, createdAt: now, updatedAt: now },
  ];
  for (const c of classes) {
    batch.set(doc(db, 'classes', c.id), c);
  }

  // 4. Students
  const initialStudents: Student[] = [
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
  ];
  for (const s of initialStudents) {
    batch.set(doc(db, 'students', s.id), s);
  }

  // 5. School Settings
  const schoolSettings: SchoolSettings = {
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
  };
  batch.set(doc(db, 'schoolSettings', 'main'), schoolSettings);

  // 6. Audit Log
  const initialLog: AuditLog = {
    id: 'log_boot',
    actorUserId: 'usr_admin',
    actorName: 'System Bootstrap',
    actorRole: 'ADMIN',
    action: 'CENTRALIZED_FIRESTORE_INIT',
    targetType: 'SYSTEM',
    details: 'Inisialisasi database terpusat Firebase Firestore SIPRESMA MAN 4 Kediri.',
    createdAt: now,
  };
  batch.set(doc(db, 'auditLogs', 'log_boot'), initialLog);

  await batch.commit();
}

// -----------------------------------------------------------------------------
// CENTRALIZED FIRESTORE API CLIENT
// -----------------------------------------------------------------------------

export const firestoreService = {
  // 1. Auth: Login
  async login(username: string, password: string): Promise<{ token: string; user: UserProfile }> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'profiles'));
    const allProfiles = snap.docs.map((d) => d.data() as UserProfile & { passwordHash?: string });

    const matched = allProfiles.find(
      (p) => p.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matched) {
      throw new Error('Username atau password salah.');
    }

    if (!matched.isActive) {
      throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
    }

    const isValid = await verifyPasswordClient(password, matched.passwordHash || '1234');
    if (!isValid) {
      throw new Error('Username atau password salah.');
    }

    // Resolve class name
    let assignedClassName: string | null = null;
    if (matched.assignedClassId) {
      const clsDoc = await getDoc(doc(db, 'classes', matched.assignedClassId));
      if (clsDoc.exists()) {
        assignedClassName = (clsDoc.data() as ClassItem).className;
      }
    }

    const user: UserProfile = {
      id: matched.id,
      username: matched.username,
      fullName: matched.fullName,
      role: matched.role,
      assignedClassId: matched.assignedClassId,
      assignedClassName,
      isActive: matched.isActive,
      mustChangePassword: matched.mustChangePassword,
      createdAt: matched.createdAt,
      updatedAt: matched.updatedAt,
    };

    const token = 'token_' + matched.id + '_' + Date.now();

    // Audit log
    await this.logAudit(user.id, user.fullName, user.role, 'LOGIN', 'AUTH', user.id, `Masuk ke sistem`);

    return { token, user };
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    await ensureFirestoreCentralizedData();
    const snap = await getDoc(doc(db, 'profiles', userId));
    if (!snap.exists()) return null;
    const data = snap.data() as UserProfile;
    let assignedClassName: string | null = null;
    if (data.assignedClassId) {
      const clsDoc = await getDoc(doc(db, 'classes', data.assignedClassId));
      if (clsDoc.exists()) {
        assignedClassName = (clsDoc.data() as ClassItem).className;
      }
    }
    return {
      ...data,
      id: snap.id,
      assignedClassName,
    };
  },

  async changePassword(userId: string, newPassword: string, currentPassword?: string): Promise<{ success: boolean; message: string }> {
    const ref = doc(db, 'profiles', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Pengguna tidak ditemukan.');
    const data = snap.data();

    if (currentPassword) {
      const isValid = await verifyPasswordClient(currentPassword, data.passwordHash || '1234');
      if (!isValid) throw new Error('Password lama yang Anda masukkan salah.');
    }

    const newHash = await hashPasswordClient(newPassword);
    await updateDoc(ref, {
      passwordHash: newHash,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, message: 'Password berhasil diubah di database terpusat.' };
  },

  async resetPassword(targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const newHash = await hashPasswordClient(newPassword);
    await updateDoc(doc(db, 'profiles', targetUserId), {
      passwordHash: newHash,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    });
    return { success: true, message: 'Password berhasil direset di database terpusat.' };
  },

  // 2. Classes
  async getClasses(): Promise<ClassItem[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'classes'));
    const list: ClassItem[] = snap.docs.map((d) => ({ ...(d.data() as ClassItem), id: d.id }));

    // Enrich with student count and secretary name
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = studentsSnap.docs.map((d) => d.data() as Student);
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const profiles = profilesSnap.docs.map((d) => d.data() as UserProfile);

    return list.map((c) => {
      const count = students.filter((s) => s.classId === c.id && s.isActive).length;
      const sec = c.secretaryUserId ? profiles.find((p) => p.id === c.secretaryUserId) : null;
      return {
        ...c,
        studentCount: count,
        secretaryName: sec ? sec.fullName : null,
      };
    });
  },

  async createClass(data: { className: string; gradeLevel: 'X' | 'XI' | 'XII'; secretaryUserId?: string | null }): Promise<ClassItem> {
    const id = 'cls_' + Date.now();
    const now = new Date().toISOString();
    const newClass: ClassItem = {
      id,
      className: data.className.trim(),
      gradeLevel: data.gradeLevel,
      academicYearId: 'ay_2025_2026',
      secretaryUserId: data.secretaryUserId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'classes', id), newClass);
    return newClass;
  },

  async updateClass(id: string, data: Partial<ClassItem>): Promise<ClassItem> {
    const ref = doc(db, 'classes', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Kelas tidak ditemukan');
    const updated = { ...snap.data(), ...data, updatedAt: new Date().toISOString() } as ClassItem;
    await setDoc(ref, updated, { merge: true });
    return updated;
  },

  async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    await deleteDoc(doc(db, 'classes', id));
    return { success: true, message: 'Kelas berhasil dihapus dari database terpusat.' };
  },

  // 3. Students
  async getStudents(params?: { classId?: string; search?: string; isActive?: string | boolean }): Promise<Student[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'students'));
    let list: Student[] = snap.docs.map((d) => ({ ...(d.data() as Student), id: d.id }));

    // Filter in JS to avoid index requirement issues
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

    // Resolve class names
    const classesSnap = await getDocs(collection(db, 'classes'));
    const classes = classesSnap.docs.map((d) => ({ ...(d.data() as ClassItem), id: d.id }));

    return list.map((s) => {
      const c = classes.find((cls) => cls.id === s.classId);
      return {
        ...s,
        className: c ? c.className : 'Tidak Diketahui',
      };
    });
  },

  async createStudent(data: { nis: string; nisn?: string; fullName: string; gender: 'L' | 'P'; classId: string }): Promise<Student> {
    const id = 'stu_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const student: Student = {
      id,
      nis: data.nis.trim(),
      nisn: data.nisn ? data.nisn.trim() : '',
      fullName: data.fullName.trim(),
      gender: data.gender,
      classId: data.classId,
      academicYearId: 'ay_2025_2026',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'students', id), student);
    return student;
  },

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const ref = doc(db, 'students', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Siswa tidak ditemukan');
    const updated = { ...snap.data(), ...data, updatedAt: new Date().toISOString() } as Student;
    await setDoc(ref, updated, { merge: true });
    return updated;
  },

  async moveStudentClass(id: string, targetClassId: string): Promise<{ success: boolean; message: string; student: Student }> {
    const ref = doc(db, 'students', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Siswa tidak ditemukan');
    const student = snap.data() as Student;
    student.classId = targetClassId;
    student.updatedAt = new Date().toISOString();
    await setDoc(ref, student, { merge: true });
    return { success: true, message: 'Siswa berhasil dipindahkan.', student };
  },

  async deleteStudent(id: string): Promise<{ success: boolean; message: string }> {
    const ref = doc(db, 'students', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Siswa tidak ditemukan');
    const stu = snap.data() as Student;
    // Deactivate to keep historical integrity
    stu.isActive = false;
    stu.updatedAt = new Date().toISOString();
    await setDoc(ref, stu, { merge: true });
    return { success: true, message: `Siswa ${stu.fullName} telah dinonaktifkan.` };
  },

  // Delete All Students (Centralized bulk delete)
  async deleteAllStudents(params: { confirmText: string; deleteAttendance: boolean; classId?: string }): Promise<{ success: boolean; count: number; message: string }> {
    if (params.confirmText !== 'HAPUS SEMUA SISWA') {
      throw new Error('Teks konfirmasi salah.');
    }

    const studentsSnap = await getDocs(collection(db, 'students'));
    let toDelete = studentsSnap.docs;

    if (params.classId && params.classId !== 'all') {
      toDelete = toDelete.filter((d) => (d.data() as Student).classId === params.classId);
    }

    const batch = writeBatch(db);
    toDelete.forEach((d) => {
      batch.delete(d.ref);
    });

    if (params.deleteAttendance) {
      const attSnap = await getDocs(collection(db, 'attendance'));
      attSnap.docs.forEach((a) => {
        if (!params.classId || params.classId === 'all' || (a.data() as AttendanceRecord).classId === params.classId) {
          batch.delete(a.ref);
        }
      });
    }

    await batch.commit();
    return { success: true, count: toDelete.length, message: `Berhasil menghapus ${toDelete.length} siswa dari database terpusat.` };
  },

  // Bulk Import Students
  async bulkImportStudents(rows: any[], defaultClassId?: string): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    successList: Student[];
    failures: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }>;
  }> {
    const classes = await this.getClasses();
    const studentsSnap = await getDocs(collection(db, 'students'));
    const existingNis = new Set(studentsSnap.docs.map((d) => (d.data() as Student).nis));

    const batch = writeBatch(db);
    const successList: Student[] = [];
    const failures: Array<{ rowNumber: number; nis?: string; name?: string; reason: string }> = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const nis = String(row.nis || '').trim();
      const fullName = String(row.fullName || '').trim();
      const nisn = String(row.nisn || '').trim();
      const gender = (row.gender && String(row.gender).trim().toUpperCase() === 'P') ? 'P' : 'L';
      let classId = row.classId || defaultClassId;

      if (!classId && row.className) {
        const found = classes.find((c) => c.className.toLowerCase() === String(row.className).toLowerCase());
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
        academicYearId: 'ay_2025_2026',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(doc(db, 'students', id), student);
      existingNis.add(nis);
      successList.push(student);
    }

    if (successList.length > 0) {
      await batch.commit();
    }

    return {
      totalProcessed: rows.length,
      successCount: successList.length,
      failureCount: failures.length,
      successList,
      failures,
    };
  },

  // 4. Users
  async getUsers(): Promise<UserProfile[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'profiles'));
    const classes = await this.getClasses();
    return snap.docs.map((d) => {
      const data = d.data() as UserProfile;
      const cls = data.assignedClassId ? classes.find((c) => c.id === data.assignedClassId) : null;
      return {
        ...data,
        id: d.id,
        assignedClassName: cls ? cls.className : null,
      };
    });
  },

  async createUser(data: any): Promise<UserProfile> {
    const id = 'usr_' + Date.now();
    const now = new Date().toISOString();
    const passHash = await hashPasswordClient(data.password || '1234');
    const newUser: UserProfile & { passwordHash: string } = {
      id,
      username: data.username.trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      assignedClassId: data.role === 'SEKRETARIS' ? data.assignedClassId || null : null,
      isActive: true,
      mustChangePassword: true,
      passwordHash: passHash,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'profiles', id), newUser);
    return newUser;
  },

  async updateUser(id: string, data: any): Promise<UserProfile> {
    const ref = doc(db, 'profiles', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Pengguna tidak ditemukan');
    const updated = { ...snap.data(), ...data, updatedAt: new Date().toISOString() } as UserProfile;
    await setDoc(ref, updated, { merge: true });
    return updated;
  },

  // 5. Attendance
  async getAttendance(params?: { classId?: string; date?: string; month?: string; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'attendance'));
    let records = snap.docs.map((d) => ({ ...(d.data() as AttendanceRecord), id: d.id }));

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

    // Enrich with student details
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = studentsSnap.docs.map((d) => ({ ...(d.data() as Student), id: d.id }));
    const classesSnap = await getDocs(collection(db, 'classes'));
    const classes = classesSnap.docs.map((d) => ({ ...(d.data() as ClassItem), id: d.id }));

    return records.map((r) => {
      const s = students.find((stu) => stu.id === r.studentId);
      const c = classes.find((cls) => cls.id === r.classId);
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
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const item of data.items) {
      // Deterministic document ID to prevent duplicate attendance on same date
      const docId = `att_${item.studentId}_${data.attendanceDate}`;
      const record: AttendanceRecord = {
        id: docId,
        studentId: item.studentId,
        classId: data.classId,
        attendanceDate: data.attendanceDate,
        status: item.status,
        notes: item.notes || '',
        recordedBy: 'system',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(doc(db, 'attendance', docId), record, { merge: true });
    }

    await batch.commit();
    return { success: true, count: data.items.length, message: `Presensi tanggal ${data.attendanceDate} berhasil disimpan di database terpusat.` };
  },

  // 6. Recaps
  async getDailyRecap(date?: string): Promise<{
    date: string;
    totalClasses: number;
    totalStudents: number;
    summary: AttendanceSummary;
    classes: ClassRecapItem[];
    unsubmittedClasses: ClassRecapItem[];
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const classes = await this.getClasses();
    const students = await this.getStudents({ isActive: true });
    const attendance = await this.getAttendance({ date: targetDate });

    let grandH = 0, grandS = 0, grandI = 0, grandA = 0;

    const classSummaries: ClassRecapItem[] = classes.filter((c) => c.isActive).map((cls) => {
      const classStudents = students.filter((s) => s.classId === cls.id);
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
      totalClasses: classes.filter((c) => c.isActive).length,
      totalStudents: students.length,
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

    const allStudents = await this.getStudents({
      classId: params.classId !== 'all' ? params.classId : undefined,
      isActive: true,
    });

    const allAtt = await this.getAttendance({
      classId: params.classId !== 'all' ? params.classId : undefined,
      startDate: filterStart,
      endDate: filterEnd,
    });

    let totalH = 0, totalS = 0, totalI = 0, totalA = 0;

    const studentRecaps: StudentRecapItem[] = allStudents.map((stu) => {
      const stuAtt = allAtt.filter((a) => a.studentId === stu.id);
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

      return {
        studentId: stu.id,
        nis: stu.nis,
        nisn: stu.nisn,
        fullName: stu.fullName,
        gender: stu.gender,
        classId: stu.classId,
        className: stu.className || '-',
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

  // 7. Settings
  async getSettings(): Promise<SchoolSettings> {
    await ensureFirestoreCentralizedData();
    const snap = await getDoc(doc(db, 'schoolSettings', 'main'));
    if (snap.exists()) {
      return snap.data() as SchoolSettings;
    }
    return {
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
      updatedAt: new Date().toISOString(),
    };
  },

  async updateSettings(data: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const current = await this.getSettings();
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'schoolSettings', 'main'), updated, { merge: true });
    return updated;
  },

  // 8. Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'academicYears'));
    return snap.docs.map((d) => ({ ...(d.data() as AcademicYear), id: d.id }));
  },

  async createAcademicYear(data: { yearName: string; startDate: string; endDate: string; isActive?: boolean }): Promise<AcademicYear> {
    const id = 'ay_' + Date.now();
    const item: AcademicYear = {
      id,
      yearName: data.yearName.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: Boolean(data.isActive),
    };
    if (item.isActive) {
      const all = await this.getAcademicYears();
      for (const other of all) {
        if (other.isActive) {
          await updateDoc(doc(db, 'academicYears', other.id), { isActive: false });
        }
      }
    }
    await setDoc(doc(db, 'academicYears', id), item);
    return item;
  },

  async updateAcademicYear(id: string, data: Partial<AcademicYear>): Promise<AcademicYear> {
    if (data.isActive) {
      const all = await this.getAcademicYears();
      for (const other of all) {
        if (other.id !== id && other.isActive) {
          await updateDoc(doc(db, 'academicYears', other.id), { isActive: false });
        }
      }
    }
    await updateDoc(doc(db, 'academicYears', id), data);
    const snap = await getDoc(doc(db, 'academicYears', id));
    return snap.data() as AcademicYear;
  },

  async deleteAcademicYear(id: string): Promise<{ success: boolean; message: string }> {
    await deleteDoc(doc(db, 'academicYears', id));
    return { success: true, message: 'Tahun ajaran berhasil dihapus dari database terpusat.' };
  },

  // 9. Calendar
  async getCalendar(): Promise<SchoolCalendarDate[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'schoolCalendar'));
    if (snap.empty) {
      return [
        { id: 'cal_1', calendarDate: '2025-08-17', isSchoolDay: false, description: 'HUT Kemerdekaan RI ke-80', academicYearId: 'ay_2025_2026' },
        { id: 'cal_2', calendarDate: '2025-10-22', isSchoolDay: true, description: 'Hari Santri Nasional (Upacara Khusus)', academicYearId: 'ay_2025_2026' },
      ];
    }
    return snap.docs.map((d) => ({ ...(d.data() as SchoolCalendarDate), id: d.id }));
  },

  // 10. Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    await ensureFirestoreCentralizedData();
    const snap = await getDocs(collection(db, 'auditLogs'));
    const list = snap.docs.map((d) => ({ ...(d.data() as AuditLog), id: d.id }));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async logAudit(actorUserId: string, actorName: string, actorRole: string, action: string, targetType: string, targetId?: string, details?: string): Promise<void> {
    const logId = 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const log: AuditLog = {
      id: logId,
      actorUserId,
      actorName,
      actorRole: actorRole as UserRole,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'auditLogs', logId), log);
    } catch {
      // non-blocking
    }
  },

  // 11. Database Status
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
    await ensureFirestoreCentralizedData();
    const [stuSnap, clsSnap, profSnap, attSnap, aySnap, logSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'classes')),
      getDocs(collection(db, 'profiles')),
      getDocs(collection(db, 'attendance')),
      getDocs(collection(db, 'academicYears')),
      getDocs(collection(db, 'auditLogs')),
    ]);

    return {
      mode: 'firebase_firestore',
      databaseType: 'Firebase Firestore (Google Cloud)',
      projectId: 'jovial-citron-msjh2',
      databaseId: 'ai-studio-sipresmapresensi-839a9f3e-c993-4ff5-983b-75c7dfe22d09',
      isSupabaseConfigured: false,
      supabaseStatus: 'Disconnected (Migrated to Firebase Firestore Terpusat)',
      storageType: 'Database Terpusat Firebase Firestore Cloud',
      counts: {
        students: stuSnap.size,
        classes: clsSnap.size,
        users: profSnap.size,
        attendanceRecords: attSnap.size,
        academicYears: aySnap.size,
        auditLogs: logSnap.size,
      },
      systemTime: new Date().toISOString(),
    };
  },
};
