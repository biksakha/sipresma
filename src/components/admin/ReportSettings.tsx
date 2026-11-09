import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, AlertCircle, Building, User, FileText, MapPin, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { SchoolSettings } from '../../types';

interface Props {
  onSettingsUpdated?: (newSettings: SchoolSettings) => void;
}

export const ReportSettings: React.FC<Props> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalNip, setPrincipalNip] = useState('');
  const [studentAffairsName, setStudentAffairsName] = useState('');
  const [studentAffairsNip, setStudentAffairsNip] = useState('');
  const [reportPreparerName, setReportPreparerName] = useState('');
  const [reportSignatoryTitle, setReportSignatoryTitle] = useState('');
  const [reportCity, setReportCity] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setSchoolName(data.schoolName);
      setSchoolAddress(data.schoolAddress);
      setLogoUrl(data.logoUrl || '');
      setPrincipalName(data.principalName);
      setPrincipalNip(data.principalNip);
      setStudentAffairsName(data.studentAffairsName);
      setStudentAffairsNip(data.studentAffairsNip);
      setReportPreparerName(data.reportPreparerName);
      setReportSignatoryTitle(data.reportSignatoryTitle);
      setReportCity(data.reportCity);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat pengaturan madrasah');
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran berkas logo maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
        showToast('success', 'Berkas logo berhasil dimuat. Klik Simpan untuk memperbarui.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({
        schoolName,
        schoolAddress,
        logoUrl,
        principalName,
        principalNip,
        studentAffairsName,
        studentAffairsNip,
        reportPreparerName,
        reportSignatoryTitle,
        reportCity,
      });
      setSettings(updated);
      showToast('success', 'Pengaturan identitas, logo, dan penandatangan laporan berhasil disimpan.');
      onSettingsUpdated?.(updated);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Memuat konfigurasi madrasah...</div>;
  }

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

      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Pengaturan Laporan & Identitas Pejabat
        </h1>
        <p className="text-xs text-slate-500">
          Konfigurasi nama madrasah, alamat, dan pejabat penandatangan dokumen rekapitulasi presensi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Madrasah Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <ImageIcon className="h-4 w-4 text-emerald-700" />
            <span>Logo Resmi Madrasah</span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo Preview */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 overflow-hidden shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Pratinjau Logo" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Building className="h-8 w-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px] font-semibold">Belum Ada Logo</span>
                  </div>
                )}
              </div>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Hapus Logo</span>
                </button>
              )}
            </div>

            {/* Upload or URL Controls */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unggah Berkas Logo (PNG, JPG, SVG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900 cursor-pointer"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Logo akan ditampilkan pada Kop Surat Laporan Resmi A4, Dokumen Word, Header aplikasi, dan Halaman Login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Masukkan URL Gambar Logo
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo-man4kediri.png"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Identitas Madrasah */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <Building className="h-4 w-4 text-emerald-700" />
            <span>Identitas Madrasah</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Nama Madrasah</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Kota Penerbitan Laporan</label>
              <input
                type="text"
                required
                value={reportCity}
                onChange={(e) => setReportCity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">Alamat Lengkap Madrasah</label>
              <textarea
                rows={2}
                required
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Pejabat Penandatangan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-sm">
            <User className="h-4 w-4 text-emerald-700" />
            <span>Pejabat Penandatangan Laporan Resmi</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Nama Kepala Madrasah</label>
              <input
                type="text"
                required
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">NIP Kepala Madrasah</label>
              <input
                type="text"
                required
                value={principalNip}
                onChange={(e) => setPrincipalNip(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Nama Pejabat / Waka Kesiswaan</label>
              <input
                type="text"
                required
                value={studentAffairsName}
                onChange={(e) => setStudentAffairsName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">NIP Pejabat Kesiswaan</label>
              <input
                type="text"
                required
                value={studentAffairsNip}
                onChange={(e) => setStudentAffairsNip(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Petugas / Penyusun Laporan Bawaan</label>
              <input
                type="text"
                required
                value={reportPreparerName}
                onChange={(e) => setReportPreparerName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Jabatan Penandatangan Laporan</label>
              <input
                type="text"
                required
                value={reportSignatoryTitle}
                onChange={(e) => setReportSignatoryTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 shadow-md shadow-emerald-900/10 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
