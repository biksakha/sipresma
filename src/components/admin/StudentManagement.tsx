import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRightLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UserCheck,
  UserX,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, ClassItem } from '../../types';
import { downloadStudentTemplate, parseUploadedStudentFile } from '../../utils/excel';

interface Props {
  role: 'ADMIN' | 'SEKRETARIS';
  assignedClassId?: string | null;
}

export const StudentManagement: React.FC<Props> = ({ role, assignedClassId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    role === 'SEKRETARIS' && assignedClassId ? assignedClassId : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('true');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formClassId, setFormClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');

  // Bulk import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Bulk delete states
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [deleteAttendanceAlso, setDeleteAttendanceAlso] = useState(false);
  const [deleteAllClassTarget, setDeleteAllClassTarget] = useState('all');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allClasses, stuList] = await Promise.all([
        api.getClasses(),
        api.getStudents({
          classId: selectedClassId !== 'all' ? selectedClassId : undefined,
          search: search || undefined,
          isActive: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ]);
      setClasses(allClasses);
      setStudents(stuList);
      if (!formClassId && allClasses.length > 0) {
        setFormClassId(role === 'SEKRETARIS' && assignedClassId ? assignedClassId : allClasses[0].id);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const openAddModal = () => {
    setFormNis('');
    setFormNisn('');
    setFormFullName('');
    setFormGender('L');
    setFormClassId(role === 'SEKRETARIS' && assignedClassId ? assignedClassId : classes[0]?.id || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudent({
        nis: formNis,
        nisn: formNisn,
        fullName: formFullName,
        gender: formGender,
        classId: formClassId,
      });
      setIsAddModalOpen(false);
      showToast('success', `Siswa ${formFullName} berhasil ditambahkan.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const openEditModal = (stu: Student) => {
    setSelectedStudent(stu);
    setFormNis(stu.nis);
    setFormNisn(stu.nisn || '');
    setFormFullName(stu.fullName);
    setFormGender(stu.gender);
    setFormClassId(stu.classId);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.updateStudent(selectedStudent.id, {
        nis: formNis,
        nisn: formNisn,
        fullName: formFullName,
        gender: formGender,
        classId: formClassId,
      });
      setIsEditModalOpen(false);
      showToast('success', `Data siswa ${formFullName} berhasil diperbarui.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const openMoveModal = (stu: Student) => {
    setSelectedStudent(stu);
    setTargetClassId(classes.find((c) => c.id !== stu.classId)?.id || '');
    setIsMoveModalOpen(true);
  };

  const handleMoveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !targetClassId) return;
    try {
      await api.moveStudentClass(selectedStudent.id, targetClassId);
      setIsMoveModalOpen(false);
      showToast('success', `Siswa berhasil dipindahkan.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteOrDeactivate = async (stu: Student) => {
    const confirmMsg = `Apakah Anda yakin ingin menonaktifkan atau menghapus siswa "${stu.fullName}"? Data historis presensi akan tetap tersimpan aman.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteStudent(stu.id);
      showToast('success', res.message);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Bulk Upload File Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    try {
      const previewRows = await parseUploadedStudentFile(file);
      setImportPreview(previewRows);
    } catch (err: any) {
      showToast('error', 'Gagal membaca berkas Excel. Pastikan format valid.');
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview.length) return;
    setImportLoading(true);
    try {
      const res = await api.bulkImportStudents(
        importPreview,
        role === 'SEKRETARIS' ? assignedClassId || undefined : undefined
      );
      setImportResult(res);
      showToast('success', `Impor selesai: ${res.successCount} berhasil, ${res.failureCount} gagal.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setImportLoading(false);
    }
  };

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

      {/* Header and Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Manajemen Data Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data siswa, NIS, kelas, dan proses impor massal melalui template Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === 'ADMIN' && (
            <button
              onClick={() => {
                setConfirmDeleteText('');
                setDeleteAttendanceAlso(false);
                setDeleteAllClassTarget('all');
                setIsDeleteAllModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Hapus Seluruh Siswa</span>
            </button>
          )}

          <button
            onClick={downloadStudentTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            <span>Unduh Template Excel</span>
          </button>

          <button
            onClick={() => {
              setImportFile(null);
              setImportPreview([]);
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 text-blue-700" />
            <span>Impor Excel</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari siswa berdasarkan nama atau NIS..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Class Filter (Admin only, Secretary locked to assigned) */}
          {role === 'ADMIN' && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.className}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="true">Status: Aktif</option>
            <option value="false">Status: Nonaktif</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-3 text-center">JK</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                students.map((stu, index) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{index + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{stu.nis}</td>
                    <td className="py-2.5 px-3 text-slate-500">{stu.nisn || '-'}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{stu.fullName}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                      {stu.gender === 'L' ? 'L' : 'P'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-800">{stu.className}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-semibold ${stu.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {stu.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {role === 'ADMIN' && (
                          <button
                            onClick={() => openMoveModal(stu)}
                            title="Pindah Kelas"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(stu)}
                          title="Edit Siswa"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrDeactivate(stu)}
                          title="Hapus / Nonaktifkan"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT STUDENT */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {isAddModalOpen ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={isAddModalOpen ? handleSaveStudent : handleUpdateStudent}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700">NIS (Nomor Induk Siswa) *</label>
                <input
                  type="text"
                  required
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value)}
                  placeholder="Contoh: 25101"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">NISN (Opsional)</label>
                <input
                  type="text"
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  placeholder="Nomor Induk Siswa Nasional"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Nama lengkap sesuai ijazah"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Rombongan Belajar (Kelas)</label>
                  <select
                    disabled={role === 'SEKRETARIS'}
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden disabled:bg-slate-100"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVE CLASS */}
      {isMoveModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Pindahkan Siswa Kelas</h3>
            <p className="mt-1 text-xs text-slate-500">
              Pindahkan <span className="font-bold text-slate-800">{selectedStudent.fullName}</span> ke kelas baru.
            </p>

            <form onSubmit={handleMoveClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Pilih Kelas Tujuan</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  {classes
                    .filter((c) => c.id !== selectedStudent.classId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.className} ({c.gradeLevel})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Konfirmasi Pindah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK IMPORT EXCEL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">Impor Siswa Massal via Excel</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Instructions */}
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
                <span className="font-bold">Langkah Impor:</span>
                <ol className="mt-1 list-decimal list-inside space-y-1 text-emerald-800">
                  <li>Unduh template Excel kosong terlebih dahulu.</li>
                  <li>Isi kolom NIS, NISN, Nama Lengkap, Jenis Kelamin (L/P), dan Kelas.</li>
                  <li>Pilih berkas lalu tinjau data pratinjau sebelum disimpan.</li>
                </ol>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih File (.xlsx / .csv)</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-800 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                />
              </div>

              {/* Preview Table */}
              {importPreview.length > 0 && !importResult && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Pratinjau Data ({importPreview.length} Siswa Terdeteksi):
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2 text-center">JK</th>
                          <th className="p-2">Kelas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{row.nis}</td>
                            <td className="p-2 font-medium">{row.fullName}</td>
                            <td className="p-2 text-center">{row.gender}</td>
                            <td className="p-2 font-semibold text-emerald-800">{row.className}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Report */}
              {importResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-200">
                      <span className="font-bold">Berhasil Diimpor:</span> {importResult.successCount} siswa
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3 text-rose-800 ring-1 ring-rose-200">
                      <span className="font-bold">Gagal / Ditolak:</span> {importResult.failureCount} baris
                    </div>
                  </div>

                  {importResult.failures.length > 0 && (
                    <div className="rounded-xl border border-rose-200 p-3 text-xs space-y-1 bg-rose-50/50">
                      <span className="font-bold text-rose-900">Rincian Baris Gagal:</span>
                      <div className="max-h-36 overflow-y-auto space-y-1 mt-1">
                        {importResult.failures.map((f: any, idx: number) => (
                          <div key={idx} className="text-rose-700">
                            Baris #{f.rowNumber}: {f.reason} {f.name ? `(${f.name})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              {importPreview.length > 0 && !importResult && (
                <button
                  type="button"
                  disabled={importLoading}
                  onClick={handleExecuteImport}
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  {importLoading ? 'Memproses Impor...' : `Konfirmasi Simpan ${importPreview.length} Siswa`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS SELURUH DATA SISWA (DANGER ZONE) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100 text-rose-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Seluruh Data Siswa
                </h3>
                <p className="text-xs text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-900 leading-relaxed">
                Peringatan: Seluruh data siswa ({students.length} siswa saat ini) akan dihapus secara permanen dari database.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Penghapusan:</label>
                <select
                  value={deleteAllClassTarget}
                  onChange={(e) => setDeleteAllClassTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-rose-600 focus:outline-hidden"
                >
                  <option value="all">Seluruh Siswa (Semua Kelas Madrasah)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Hanya Siswa di Kelas {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="delAttCheck"
                  checked={deleteAttendanceAlso}
                  onChange={(e) => setDeleteAttendanceAlso(e.target.checked)}
                  className="rounded-md border-slate-300 text-rose-600 focus:ring-rose-600"
                />
                <label htmlFor="delAttCheck" className="text-slate-700 font-medium">
                  Hapus juga seluruh catatan riwayat presensi siswa ini
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ketik <span className="font-mono text-rose-600 font-black">HAPUS SEMUA SISWA</span> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="HAPUS SEMUA SISWA"
                  className="w-full rounded-xl border border-rose-300 p-2 font-mono text-xs text-slate-900 focus:border-rose-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmDeleteText !== 'HAPUS SEMUA SISWA' || isDeletingAll}
                onClick={async () => {
                  setIsDeletingAll(true);
                  try {
                    const res = await api.deleteAllStudents({
                      confirmText: confirmDeleteText,
                      deleteAttendance: deleteAttendanceAlso,
                      classId: deleteAllClassTarget,
                    });
                    setIsDeleteAllModalOpen(false);
                    showToast('success', res.message);
                    loadData();
                  } catch (err: any) {
                    showToast('error', err.message);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40 shadow-xs"
              >
                {isDeletingAll ? 'Menghapus...' : 'Hapus Siswa Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
