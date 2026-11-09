import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  CheckCheck,
  Clock,
  AlertTriangle,
  XCircle,
  MessageSquare,
  HelpCircle,
  Users,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, UserProfile, AttendanceStatus, AttendanceRecord, ClassItem, AcademicYear } from '../../types';

interface Props {
  user: UserProfile;
  classIdOverride?: string; // If admin is helping input
  activeAcademicYear?: string;
}

export const AttendanceInput: React.FC<Props> = ({ user, classIdOverride, activeAcademicYear: propActiveYear }) => {
  // Classes and Academic Year State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classIdOverride || user.assignedClassId || ''
  );
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>(propActiveYear || '2025/2026');

  // Attendance Form State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus | ''; notes: string }>
  >({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Note dialog
  const [activeNoteStudent, setActiveNoteStudent] = useState<{ id: string; name: string } | null>(null);
  const [tempNote, setTempNote] = useState('');

  // 1. Initial Load: Classes and Active Academic Year
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [classList, yearList] = await Promise.all([
          api.getClasses(),
          api.getAcademicYears(),
        ]);

        if (!isMounted) return;
        setClasses(classList);

        // Find active academic year
        const activeYearObj = yearList.find((y) => y.isActive);
        if (activeYearObj) {
          setActiveAcademicYear(activeYearObj.yearName);
        } else if (propActiveYear) {
          setActiveAcademicYear(propActiveYear);
        }

        // Determine default selected class
        if (!selectedClassId && classList.length > 0) {
          if (classIdOverride) {
            setSelectedClassId(classIdOverride);
          } else if (user.assignedClassId) {
            setSelectedClassId(user.assignedClassId);
          } else {
            // Admin defaults to first active class
            setSelectedClassId(classList[0].id);
          }
        }
      } catch (err: any) {
        console.error('Gagal memuat metadata kelas/tahun ajaran:', err);
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [user.assignedClassId, classIdOverride, propActiveYear]);

  // Keep propActiveYear in sync if parent changes
  useEffect(() => {
    if (propActiveYear) {
      setActiveAcademicYear(propActiveYear);
    }
  }, [propActiveYear]);

  // 2. Load Students and Attendance Records for Selected Class & Date
  const loadStudentsAndExisting = async (classId: string, date: string) => {
    if (!classId) {
      setStudents([]);
      setExistingRecords([]);
      setAttendanceMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [stuList, attList] = await Promise.all([
        api.getStudents({ classId, isActive: true }),
        api.getAttendance({ classId, date }),
      ]);

      setStudents(stuList);
      setExistingRecords(attList);

      // Map existing records if present
      const map: Record<string, { status: AttendanceStatus | ''; notes: string }> = {};
      for (const s of stuList) {
        const found = attList.find((a) => a.studentId === s.id);
        if (found) {
          map[s.id] = { status: found.status, notes: found.notes || '' };
        } else {
          map[s.id] = { status: '', notes: '' }; // initially unselected
        }
      }
      setAttendanceMap(map);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data presensi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadStudentsAndExisting(selectedClassId, selectedDate);
    } else if (classes.length === 0) {
      // If classes list is empty, stop loading
      setLoading(false);
    }
  }, [selectedClassId, selectedDate]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const setStatusForStudent = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated: typeof prev = {};
      for (const s of students) {
        updated[s.id] = {
          status: 'H',
          notes: prev[s.id]?.notes || '',
        };
      }
      return updated;
    });
    showToast('success', 'Semua siswa telah ditandai Hadir (H). Anda dapat mengubah status per siswa jika ada yang Sakit, Izin, atau Alpa.');
  };

  const openNoteDialog = (student: Student) => {
    setActiveNoteStudent({ id: student.id, name: student.fullName });
    setTempNote(attendanceMap[student.id]?.notes || '');
  };

  const saveNoteDialog = () => {
    if (!activeNoteStudent) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [activeNoteStudent.id]: {
        ...prev[activeNoteStudent.id],
        notes: tempNote,
      },
    }));
    setActiveNoteStudent(null);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      showToast('error', 'Silakan pilih rombel kelas terlebih dahulu.');
      return;
    }

    if (students.length === 0) {
      showToast('error', 'Tidak ada siswa terdaftar di kelas ini.');
      return;
    }

    // Validation: Check if any student is unassigned
    const unassigned = students.filter((s) => !attendanceMap[s.id]?.status);
    if (unassigned.length > 0) {
      const confirmProceed = window.confirm(
        `Perhatian: Ada ${unassigned.length} siswa yang belum diberi status presensi (${unassigned
          .slice(0, 3)
          .map((s) => s.fullName)
          .join(', ')}...). Apakah Anda yakin ingin menyimpan? Siswa tanpa status tidak akan dihitung hadir.`
      );
      if (!confirmProceed) return;
    }

    // Confirmation if overwriting existing records
    if (existingRecords.length > 0) {
      const confirmOverwrite = window.confirm(
        `Presensi tanggal ${selectedDate} sudah pernah disimpan sebelumnya. Apakah Anda ingin memperbarui (menimpa) catatan presensi hari ini?`
      );
      if (!confirmOverwrite) return;
    }

    setSaving(true);
    try {
      const items = students
        .filter((s) => attendanceMap[s.id]?.status)
        .map((s) => ({
          studentId: s.id,
          status: attendanceMap[s.id].status as AttendanceStatus,
          notes: attendanceMap[s.id].notes || undefined,
        }));

      const res = await api.saveBatchAttendance({
        classId: selectedClassId,
        attendanceDate: selectedDate,
        items,
      });

      showToast('success', `Berhasil! ${res.message}`);
      loadStudentsAndExisting(selectedClassId, selectedDate);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan presensi');
    } finally {
      setSaving(false);
    }
  };

  // Live Summary calculation
  let countH = 0, countS = 0, countI = 0, countA = 0, countEmpty = 0;
  for (const s of students) {
    const st = attendanceMap[s.id]?.status;
    if (st === 'H') countH++;
    else if (st === 'S') countS++;
    else if (st === 'I') countI++;
    else if (st === 'A') countA++;
    else countEmpty++;
  }

  const isAlreadySaved = existingRecords.length > 0;
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentClassName = currentClass?.className || user.assignedClassName || 'Kelas';

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
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

      {/* Top Configuration & Date Selection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-slate-900">
                Input Presensi {user.role === 'ADMIN' ? 'Siswa Madrasah' : `Kelas ${currentClassName}`}
              </span>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                T.A. {activeAcademicYear} (Ganjil)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Petugas: <span className="font-semibold text-slate-700">{user.fullName}</span> ({user.role === 'ADMIN' ? 'Administrator Utama' : `Sekretaris ${currentClassName}`}) · MAN 4 Kediri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Selector Dropdown for Admin or Multi-Class Users */}
            {(user.role === 'ADMIN' || !user.assignedClassId) && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Users className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Kelas:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.className} ({cls.studentCount || 0} Siswa)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Picker */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Mark All Present Quick Action */}
            <button
              type="button"
              disabled={students.length === 0}
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <CheckCheck className="h-4 w-4 text-emerald-700" />
              <span>Tandai Semua Hadir</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3 py-2 text-emerald-800">
            <span className="font-semibold">Hadir (H):</span>
            <span className="font-black text-base">{countH}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-blue-50/70 px-3 py-2 text-blue-800">
            <span className="font-semibold">Sakit (S):</span>
            <span className="font-black text-base">{countS}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-50/70 px-3 py-2 text-amber-800">
            <span className="font-semibold">Izin (I):</span>
            <span className="font-black text-base">{countI}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-rose-50/70 px-3 py-2 text-rose-800">
            <span className="font-semibold">Alpa (A):</span>
            <span className="font-black text-base">{countA}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-700">
            <span className="font-semibold">Belum Diisi:</span>
            <span className="font-black text-base text-slate-900">{countEmpty}</span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-2 text-center w-12">JK</th>
                <th className="py-3 px-4 text-center w-64">Status Presensi</th>
                <th className="py-3 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent"></div>
                      <span className="text-xs font-semibold">Memuat daftar siswa kelas...</span>
                    </div>
                  </td>
                </tr>
              ) : !selectedClassId ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">Silakan pilih kelas terlebih dahulu untuk mengisi presensi.</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      <span className="text-xs font-bold text-slate-700">
                        Belum ada siswa aktif terdaftar di kelas {currentClassName}.
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Tambahkan siswa baru atau lakukan impor Excel melalui menu <strong>Data Siswa</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const currentStatus = attendanceMap[student.id]?.status || '';
                  const notes = attendanceMap[student.id]?.notes;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !currentStatus ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {student.nis}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {student.fullName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-600">
                        {student.gender}
                      </td>

                      {/* Status Selection Buttons */}
                      <td className="py-2 px-4 text-center">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                          {/* HADIR (H) */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(student.id, 'H')}
                            className={`rounded-lg px-3 py-1 font-bold text-xs transition-colors cursor-pointer ${
                              currentStatus === 'H'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            H
                          </button>

                          {/* SAKIT (S) */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(student.id, 'S')}
                            className={`rounded-lg px-3 py-1 font-bold text-xs transition-colors cursor-pointer ${
                              currentStatus === 'S'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            S
                          </button>

                          {/* IZIN (I) */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(student.id, 'I')}
                            className={`rounded-lg px-3 py-1 font-bold text-xs transition-colors cursor-pointer ${
                              currentStatus === 'I'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            I
                          </button>

                          {/* ALPA (A) */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(student.id, 'A')}
                            className={`rounded-lg px-3 py-1 font-bold text-xs transition-colors cursor-pointer ${
                              currentStatus === 'A'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>

                      {/* Notes Column */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openNoteDialog(student)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                              notes
                                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                            }`}
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>{notes ? notes : 'Tambah catatan'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 bg-slate-50/80 p-4">
          <div className="text-xs text-slate-500">
            {isAlreadySaved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Presensi kelas ini pada tanggal terpilih sudah tersimpan. Klik Simpan untuk memperbarui.</span>
              </span>
            ) : (
              <span>Presensi belum disimpan ke database permanen.</span>
            )}
          </div>

          <button
            type="button"
            disabled={saving || loading || students.length === 0}
            onClick={handleSaveAttendance}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-900 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Presensi Kelas'}</span>
          </button>
        </div>
      </div>

      {/* MODAL: EDIT NOTES */}
      {activeNoteStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Catatan Presensi Siswa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeNoteStudent.name}
            </p>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700">
                Alasan / Keterangan (Contoh: Surat Dokter, Izin Keluarga)
              </label>
              <textarea
                rows={3}
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="Tuliskan keterangan sakit atau izin..."
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveNoteStudent(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveNoteDialog}
                className="rounded-xl bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
