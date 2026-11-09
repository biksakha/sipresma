import React, { useState } from 'react';
import { User, Shield, School, KeyRound, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface Props {
  user: UserProfile;
}

export const ProfileView: React.FC<Props> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Profil Akun Pengguna
        </h1>
        <p className="text-xs text-slate-500">
          Informasi identitas akun dan keamanan kata sandi.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-800 text-amber-300 shadow-md">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.fullName}</h2>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              Peran: {user.role} {user.assignedClassName ? `(${user.assignedClassName})` : ''}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">MAN 4 Kediri</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Username</div>
            <div className="mt-1 font-mono font-bold text-slate-800">{user.username}</div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Status Akun</div>
            <div className="mt-1 font-bold text-emerald-700">
              {user.isActive ? 'Aktif' : 'Nonaktif'}
            </div>
          </div>

          {user.assignedClassName && (
            <div className="sm:col-span-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Tanggung Jawab Kelas</div>
              <div className="mt-1 font-bold text-slate-800">
                Kelas {user.assignedClassName}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs"
          >
            <KeyRound className="h-4 w-4" />
            <span>Ganti Kata Sandi</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setSuccessMsg('Kata sandi berhasil diperbarui.');
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />
    </div>
  );
};
