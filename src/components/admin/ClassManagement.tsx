import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, CheckCircle2, AlertCircle, X, UserCheck } from 'lucide-react';
import { api } from '../../services/api';
import { ClassItem, UserProfile } from '../../types';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [formClassName, setFormClassName] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState<'X' | 'XI' | 'XII'>('X');
  const [formSecretaryUserId, setFormSecretaryUserId] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clsList, userList] = await Promise.all([api.getClasses(), api.getUsers()]);
      setClasses(clsList);
      setUsers(userList.filter((u) => u.role === 'SEKRETARIS'));
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setFormClassName('');
    setFormGradeLevel('X');
    setFormSecretaryUserId('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setFormClassName(cls.className);
    setFormGradeLevel(cls.gradeLevel);
    setFormSecretaryUserId(cls.secretaryUserId || '');
    setFormIsActive(cls.isActive);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.updateClass(editingClass.id, {
          className: formClassName,
          gradeLevel: formGradeLevel,
          secretaryUserId: formSecretaryUserId || null,
          isActive: formIsActive,
        });
        showToast('success', `Kelas ${formClassName} berhasil diperbarui.`);
      } else {
        await api.createClass({
          className: formClassName,
          gradeLevel: formGradeLevel,
          secretaryUserId: formSecretaryUserId || null,
        });
        showToast('success', `Kelas baru ${formClassName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (!window.confirm(`Hapus kelas ${cls.className}? Jika kelas memiliki riwayat presensi, gunakan status nonaktif.`)) {
      return;
    }
    try {
      const res = await api.deleteClass(cls.id);
      showToast('success', res.message);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
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

      {/* Header and Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Manajemen Data Kelas & Rombel
          </h1>
          <p className="text-xs text-slate-500">
            Daftar rombongan belajar (X, XI, XII) dan penugasan sekretaris presensi.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Classes Grid / Table */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Tingkat {cls.gradeLevel}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">Kelas {cls.className}</h3>
                </div>
                <span className={`text-[11px] font-semibold ${cls.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {cls.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Jumlah Siswa:</span>
                  <span className="font-bold text-slate-900">{cls.studentCount || 0} Siswa</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Tahun Ajaran:</span>
                  <span className="font-semibold text-slate-700">{cls.academicYearName}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Sekretaris Kelas:</span>
                  <span className="font-bold text-emerald-800 truncate max-w-[150px]">
                    {cls.secretaryName || 'Belum Ditugaskan'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => openEditModal(cls)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteClass(cls)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add or Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClass ? 'Edit Rombongan Belajar' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Nama Kelas / Rombel *</label>
                <input
                  type="text"
                  required
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  placeholder="Contoh: X-A, XI-MIPA 1, XII-IPS 2"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Tingkat Jenjang *</label>
                <select
                  value={formGradeLevel}
                  onChange={(e) => setFormGradeLevel(e.target.value as 'X' | 'XI' | 'XII')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="X">Kelas X (Sepuluh)</option>
                  <option value="XI">Kelas XI (Sebelas)</option>
                  <option value="XII">Kelas XII (Dua Belas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Tugaskan Sekretaris Kelas</label>
                <select
                  value={formSecretaryUserId}
                  onChange={(e) => setFormSecretaryUserId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Sekretaris yang ditugaskan hanya dapat menginput dan mengelola presensi kelas ini.
                </p>
              </div>

              {editingClass && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded-md border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700">
                    Status Kelas Aktif
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
