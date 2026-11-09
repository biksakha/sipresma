import React from 'react';
import { LogOut, KeyRound, Menu, School, Database } from 'lucide-react';
import { UserProfile } from '../../types';

interface Props {
  user: UserProfile;
  dbStatus?: { mode: string; databaseType?: string; projectId?: string };
  logoUrl?: string;
  activeAcademicYear?: string;
  onLogout: () => void;
  onChangePassword: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<Props> = ({
  user,
  dbStatus,
  logoUrl,
  activeAcademicYear,
  onLogout,
  onChangePassword,
  onToggleMobileSidebar,
}) => {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'SEKRETARIS':
        return `Sekretaris ${user.assignedClassName || 'Kelas'}`;
      case 'KESISWAAN':
        return 'Bagian Kesiswaan';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs no-print">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo MAN 4 Kediri"
              className="h-9 w-9 rounded-lg object-contain bg-white shadow-xs p-0.5 border border-slate-200"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-amber-300 shadow-xs">
              <School className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-emerald-950">SIPRESMA</span>
              <span className="text-xs text-slate-400 hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-emerald-800 hidden sm:inline">MAN 4 KEDIRI</span>
            </div>
            <p className="text-[10px] text-slate-500 hidden md:block">
              Tahun Ajaran {activeAcademicYear || '2025/2026'} · Semester Ganjil
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Database Status indicator: Firebase Firestore (Disconnected from Supabase) */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
          <Database className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-[11px] font-bold text-emerald-900">
            Firebase Firestore
          </span>
        </div>

        {/* User Info */}
        <div className="text-right">
          <div className="text-xs font-bold text-slate-800 leading-tight">
            {user.fullName}
          </div>
          <div className="text-[11px] font-medium text-emerald-700">
            {getRoleLabel(user.role)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={onChangePassword}
            title="Ganti Password"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <KeyRound className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
