import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { AcademicYear } from '../../types';

interface Props {
  onYearChanged?: () => void;
}

export const AcademicYearManagement: React.FC<Props> = ({ onYearChanged }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Form states
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAcademicYears();
      setYears(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat tahun ajaran');
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

  const openAddModal = () => {
    setEditingYear(null);
    setYearName('');
    setStartDate('2026-07-13');
    setEndDate('2027-06-19');
    setIsActive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (y: AcademicYear) => {
    setEditingYear(y);
    setYearName(y.yearName);
    setStartDate(y.startDate);
    setEndDate(y.endDate);
    setIsActive(y.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingYear) {
        await api.updateAcademicYear(editingYear.id, {
          yearName,
          startDate,
          endDate,
          isActive,
        });
        showToast('success', `Tahun ajaran ${yearName} berhasil diperbarui.`);
      } else {
        await api.createAcademicYear({
          yearName,
          startDate,
          endDate,
          isActive,
        });
        showToast('success', `Tahun ajaran ${yearName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      loadData();
      onYearChanged?.();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleSetActive = async (y: AcademicYear) => {
    try {
      await api.updateAcademicYear(y.id, { isActive: true });
      showToast('success', `Tahun ajaran aktif diubah ke ${y.yearName}.`);
      loadData();
      onYearChanged?.();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleDelete = async (y: AcademicYear) => {
    if (!window.confirm(`Hapus tahun ajaran ${y.yearName}?`)) return;
    try {
      const res = await api.deleteAcademicYear(y.id);
      showToast('success', res.message);
      loadData();
      onYearChanged?.();
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
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Kelola Tahun Ajaran Madrasah
          </h1>
          <p className="text-xs text-slate-500">
            Atur periode kalender akademik tahun ajaran dan tetapkan tahun ajaran aktif MAN 4 Kediri.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tambah Tahun Ajaran</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {years.map((y) => (
          <div
            key={y.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-colors ${
              y.isActive
                ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${y.isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      T.A. {y.yearName}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      {y.startDate} s.d. {y.endDate}
                    </span>
                  </div>
                </div>

                {y.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Check className="h-3 w-3" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">
                    Arsip
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Mulai:</span>
                  <span className="font-semibold text-slate-800">{y.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Selesai:</span>
                  <span className="font-semibold text-slate-800">{y.endDate}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              {!y.isActive ? (
                <button
                  type="button"
                  onClick={() => handleSetActive(y)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Jadikan Aktif</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700">Sedang Digunakan</span>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(y)}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {!y.isActive && (
                  <button
                    type="button"
                    onClick={() => handleDelete(y)}
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add / Edit Academic Year */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Nama Tahun Ajaran *</label>
                <input
                  type="text"
                  required
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeYearCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="activeYearCheck" className="text-xs font-semibold text-slate-700">
                  Tetapkan sebagai Tahun Ajaran Aktif Sekarang
                </label>
              </div>

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
                  Simpan Tahun Ajaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
