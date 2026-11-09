import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, KeyRound, Edit2, ShieldAlert, CheckCircle2, AlertCircle, X, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { UserProfile, ClassItem, UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('SEKRETARIS');
  const [formAssignedClassId, setFormAssignedClassId] = useState<string>('');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, cList] = await Promise.all([api.getUsers(), api.getClasses()]);
      setUsers(uList);
      setClasses(cList);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat daftar pengguna');
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
    setFormUsername('');
    setFormFullName('');
    setFormRole('SEKRETARIS');
    setFormAssignedClassId(classes[0]?.id || '');
    setFormPassword('');
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        username: formUsername,
        fullName: formFullName,
        role: formRole,
        assignedClassId: formRole === 'SEKRETARIS' ? formAssignedClassId : null,
        password: formPassword,
      });
      setIsCreateModalOpen(false);
      showToast('success', `Pengguna ${formUsername} berhasil dibuat.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const openEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullName);
    setFormRole(u.role);
    setFormAssignedClassId(u.assignedClassId || '');
    setFormIsActive(u.isActive);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, {
        username: formUsername,
        fullName: formFullName,
        role: formRole,
        assignedClassId: formRole === 'SEKRETARIS' ? formAssignedClassId : null,
        isActive: formIsActive,
      });
      setIsEditModalOpen(false);
      showToast('success', `Akun ${formUsername} berhasil diperbarui.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const openResetModal = (u: UserProfile) => {
    setSelectedUser(u);
    setResetPasswordValue('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.resetPassword(selectedUser.id, resetPasswordValue);
      setIsResetModalOpen(false);
      showToast('success', res.message);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
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
            Manajemen Pengguna & Otorisasi
          </h1>
          <p className="text-xs text-slate-500">
            Kelola akun Admin, Sekretaris Kelas, dan Bagian Kesiswaan MAN 4 Kediri.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-3">Peran (Role)</th>
                <th className="py-3 px-3">Kelas Binaan</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat daftar akun...
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.username}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{u.fullName}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-emerald-800">{u.role}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-600">
                      {u.assignedClassName || (u.role === 'SEKRETARIS' ? 'Belum ditugaskan' : '-')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      <span className={u.isActive ? 'text-emerald-700' : 'text-slate-400'}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openResetModal(u)}
                          title="Reset Password"
                          className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit Akun"
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
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

      {/* MODAL: CREATE USER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Buat Akun Pengguna Baru</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Username *</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: sekretaris_xb"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Nama lengkap petugas/guru"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Peran Akun (Role) *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="SEKRETARIS">SEKRETARIS (Khusus Rombel)</option>
                  <option value="KESISWAAN">KESISWAAN (Monitoring Seluruh Madrasah)</option>
                  <option value="ADMIN">ADMIN (Akses Penuh)</option>
                </select>
              </div>

              {formRole === 'SEKRETARIS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">Tugaskan ke Kelas</label>
                  <select
                    value={formAssignedClassId}
                    onChange={(e) => setFormAssignedClassId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700">Password Awal *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Akun Pengguna</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Peran Akun</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="SEKRETARIS">SEKRETARIS</option>
                  <option value="KESISWAAN">KESISWAAN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {formRole === 'SEKRETARIS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">Kelas Binaan</label>
                  <select
                    value={formAssignedClassId}
                    onChange={(e) => setFormAssignedClassId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeUserCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="activeUserCheck" className="text-xs font-semibold text-slate-700">
                  Akun Aktif (Bisa Login)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Reset Password Pengguna</h3>
            <p className="mt-1 text-xs text-slate-500">
              Reset password untuk akun <span className="font-bold text-slate-800">{selectedUser.username}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Password Baru *</label>
                <input
                  type="password"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                  Reset Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
