import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck, School, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface Props {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  React.useEffect(() => {
    api.getSettings().then((s) => {
      if (s?.logoUrl) setSchoolLogo(s.logoUrl);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Decorative Madrasah Background Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-700/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
        {/* Top Header Banner with Madrasah Green & Gold Accent */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 px-6 pt-8 pb-6 text-white text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-inner backdrop-blur-xs ring-1 ring-white/20 overflow-hidden">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Logo Madrasah" className="h-full w-full object-contain" />
            ) : (
              <School className="h-8 w-8 text-amber-300" />
            )}
          </div>
          <div className="inline-block rounded-md bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-amber-200 uppercase">
            Kementerian Agama RI
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
            SIPRESMA
          </h1>
          <p className="text-xs font-medium text-emerald-100">
            Sistem Informasi Presensi Madrasah MAN 4 Kediri
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Username</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pr-3 pl-9 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pr-10 pl-9 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Memeriksa kredensial...</span>
              ) : (
                <>
                  <span>Masuk ke SIPRESMA</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sistem Presensi Resmi MAN 4 Kediri · Terenkripsi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
