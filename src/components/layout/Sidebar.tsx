import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  Sliders,
  History,
  LogOut,
  Calendar,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';

interface Props {
  role: UserRole;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  assignedClassName?: string | null;
}

export const Sidebar: React.FC<Props> = ({
  role,
  activeTab,
  onSelectTab,
  onLogout,
  mobileOpen,
  onCloseMobile,
  assignedClassName,
}) => {
  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Data Siswa', icon: GraduationCap },
        { id: 'classes', label: 'Data Kelas', icon: Users },
        { id: 'academic_years', label: 'Tahun Ajaran', icon: Calendar },
        { id: 'users', label: 'Data Pengguna', icon: UserCheck },
        { id: 'attendance', label: 'Presensi', icon: CalendarCheck },
        { id: 'recap', label: 'Rekapitulasi', icon: FileSpreadsheet },
        { id: 'report_settings', label: 'Pengaturan Laporan', icon: Settings },
        { id: 'app_settings', label: 'Pengaturan Aplikasi', icon: Sliders },
        { id: 'audit_logs', label: 'Riwayat Aktivitas', icon: History },
      ];
    }

    if (role === 'SEKRETARIS') {
      return [
        { id: 'dashboard', label: `Dashboard ${assignedClassName || 'Kelas'}`, icon: LayoutDashboard },
        { id: 'students', label: 'Data Siswa', icon: GraduationCap },
        { id: 'attendance_input', label: 'Input Presensi', icon: CalendarCheck },
        { id: 'attendance_history', label: 'Riwayat Presensi', icon: History },
        { id: 'monthly_report', label: 'Laporan Bulanan', icon: FileSpreadsheet },
      ];
    }

    if (role === 'KESISWAAN') {
      return [
        { id: 'dashboard', label: 'Dashboard Kesiswaan', icon: LayoutDashboard },
        { id: 'recap_daily', label: 'Rekapitulasi Harian', icon: CalendarCheck },
        { id: 'recap_monthly', label: 'Rekapitulasi Bulanan', icon: Calendar },
        { id: 'recap_semester', label: 'Rekapitulasi Semester', icon: FileSpreadsheet },
        { id: 'recap_yearly', label: 'Rekapitulasi Tahunan', icon: FileText },
        { id: 'recap_class', label: 'Rekap Per Kelas', icon: Users },
        { id: 'recap_student', label: 'Rekap Per Siswa', icon: GraduationCap },
        { id: 'print_reports', label: 'Cetak Laporan', icon: Printer },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-100'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-xs font-black text-white">
              M4
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">MAN 4 KEDIRI</div>
              <div className="text-[10px] text-slate-500">SIPRESMA v1.0</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Area */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
};
