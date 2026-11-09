import React, { useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, clearStoredSession } from './services/api';
import { UserProfile } from './types';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChangePasswordModal } from './components/ChangePasswordModal';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { ClassManagement } from './components/admin/ClassManagement';
import { UserManagement } from './components/admin/UserManagement';
import { ReportSettings } from './components/admin/ReportSettings';
import { AppSettings } from './components/admin/AppSettings';
import { AcademicYearManagement } from './components/admin/AcademicYearManagement';
import { AuditLogsView } from './components/admin/AuditLogsView';

// Sekretaris Views
import { SekretarisDashboard } from './components/sekretaris/SekretarisDashboard';
import { AttendanceInput } from './components/sekretaris/AttendanceInput';
import { AttendanceHistory } from './components/sekretaris/AttendanceHistory';

// Kesiswaan Views
import { KesiswaanDashboard } from './components/kesiswaan/KesiswaanDashboard';

// Common Views
import { RecapView } from './components/common/RecapView';
import { ProfileView } from './components/common/ProfileView';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(undefined);
  const [settings, setSettings] = useState<any>(null);
  const [activeAcademicYear, setActiveAcademicYear] = useState<string>('2025/2026');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const loadMeta = async () => {
    try {
      const [schSettings, yearsList] = await Promise.all([
        api.getSettings(),
        api.getAcademicYears(),
      ]);
      setSettings(schSettings);
      const active = yearsList.find((y) => y.isActive);
      if (active) setActiveAcademicYear(active.yearName);
    } catch {
      // ignore
    }
  };

  // Authenticate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setCheckingAuth(false);
        return;
      }

      try {
        const [me, dbInfo] = await Promise.all([
          api.getMe(),
          api.getDatabaseStatus(),
        ]);
        setUser(me);
        setDbStatus(dbInfo);
        loadMeta();
      } catch (err) {
        console.warn('Session expired or server restarted:', err);
        clearStoredSession();
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
    loadMeta();
  };

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-xs font-semibold text-slate-600">Menghubungkan ke SIPRESMA MAN 4 Kediri...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render content according to user role and active tab
  const renderContent = () => {
    if (user.role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'students':
          return <StudentManagement role="ADMIN" />;
        case 'classes':
          return <ClassManagement />;
        case 'academic_years':
          return <AcademicYearManagement onYearChanged={loadMeta} />;
        case 'users':
          return <UserManagement />;
        case 'attendance':
          return <AttendanceInput user={user} activeAcademicYear={activeAcademicYear} />;
        case 'recap':
          return <RecapView role="ADMIN" activeAcademicYear={activeAcademicYear} />;
        case 'report_settings':
          return <ReportSettings onSettingsUpdated={(s) => setSettings(s)} />;
        case 'app_settings':
          return <AppSettings onYearChanged={loadMeta} />;
        case 'audit_logs':
          return <AuditLogsView />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    if (user.role === 'SEKRETARIS') {
      switch (activeTab) {
        case 'dashboard':
          return <SekretarisDashboard user={user} onNavigate={setActiveTab} />;
        case 'students':
          return <StudentManagement role="SEKRETARIS" assignedClassId={user.assignedClassId} />;
        case 'attendance_input':
          return <AttendanceInput user={user} activeAcademicYear={activeAcademicYear} />;
        case 'attendance_history':
          return <AttendanceHistory user={user} />;
        case 'monthly_report':
          return (
            <RecapView
              role="SEKRETARIS"
              assignedClassId={user.assignedClassId}
              assignedClassName={user.assignedClassName}
              defaultMode="monthly"
              activeAcademicYear={activeAcademicYear}
            />
          );
        case 'profile':
          return <ProfileView user={user} />;
        default:
          return <SekretarisDashboard user={user} onNavigate={setActiveTab} />;
      }
    }

    if (user.role === 'KESISWAAN') {
      switch (activeTab) {
        case 'dashboard':
          return <KesiswaanDashboard onNavigate={setActiveTab} />;
        case 'recap_daily':
          return <RecapView role="KESISWAAN" defaultMode="daily" activeAcademicYear={activeAcademicYear} />;
        case 'recap_monthly':
          return <RecapView role="KESISWAAN" defaultMode="monthly" activeAcademicYear={activeAcademicYear} />;
        case 'recap_semester':
          return <RecapView role="KESISWAAN" defaultMode="semester" activeAcademicYear={activeAcademicYear} />;
        case 'recap_yearly':
          return <RecapView role="KESISWAAN" defaultMode="yearly" activeAcademicYear={activeAcademicYear} />;
        case 'recap_class':
          return <RecapView role="KESISWAAN" defaultMode="monthly" activeAcademicYear={activeAcademicYear} />;
        case 'recap_student':
          return <RecapView role="KESISWAAN" defaultMode="semester" activeAcademicYear={activeAcademicYear} />;
        case 'print_reports':
          return <RecapView role="KESISWAAN" defaultMode="monthly" activeAcademicYear={activeAcademicYear} />;
        case 'profile':
          return <ProfileView user={user} />;
        default:
          return <KesiswaanDashboard onNavigate={setActiveTab} />;
      }
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        role={user.role}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        assignedClassName={user.assignedClassName}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          dbStatus={dbStatus}
          logoUrl={settings?.logoUrl}
          activeAcademicYear={activeAcademicYear}
          onLogout={handleLogout}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderContent()}</div>
        </main>
      </div>

      {/* Mandatory Password Change Modal on First Login */}
      {user.mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          isMandatory={true}
          onSuccess={() => {
            setUser({ ...user, mustChangePassword: false });
          }}
        />
      )}

      {/* Standard User-Requested Password Change Modal */}
      {!user.mustChangePassword && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          isMandatory={false}
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={() => {
            setIsChangePasswordOpen(false);
          }}
        />
      )}
    </div>
  );
}
