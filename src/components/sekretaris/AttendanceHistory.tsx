import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { UserProfile, AttendanceRecord } from '../../types';

interface Props {
  user: UserProfile;
}

export const AttendanceHistory: React.FC<Props> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async (date: string) => {
    setLoading(true);
    try {
      const data = await api.getAttendance({
        classId: user.assignedClassId || undefined,
        date,
      });
      setRecords(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(selectedDate);
  }, [user.assignedClassId, selectedDate]);

  let h = 0, s = 0, i = 0, a = 0;
  records.forEach((r) => {
    if (r.status === 'H') h++;
    else if (r.status === 'S') s++;
    else if (r.status === 'I') i++;
    else if (r.status === 'A') a++;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Riwayat Presensi Kelas {user.assignedClassName || ''}
          </h1>
          <p className="text-xs text-slate-500">
            Daftar rekaman kehadiran harian yang telah tersimpan.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
          <Calendar className="h-4 w-4 text-emerald-700" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
          <div className="text-[11px] font-semibold text-emerald-700">Hadir (H)</div>
          <div className="mt-1 text-xl font-black text-emerald-800">{h} Siswa</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <div className="text-[11px] font-semibold text-blue-700">Sakit (S)</div>
          <div className="mt-1 text-xl font-black text-blue-800">{s} Siswa</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <div className="text-[11px] font-semibold text-amber-700">Izin (I)</div>
          <div className="mt-1 text-xl font-black text-amber-800">{i} Siswa</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
          <div className="text-[11px] font-semibold text-rose-700">Alpa (A)</div>
          <div className="mt-1 text-xl font-black text-rose-800">{a} Siswa</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat riwayat presensi...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada rekaman presensi pada tanggal {selectedDate}.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  let statusBg = 'bg-emerald-50 text-emerald-800';
                  let statusLabel = 'Hadir';
                  if (r.status === 'S') {
                    statusBg = 'bg-blue-50 text-blue-800';
                    statusLabel = 'Sakit';
                  } else if (r.status === 'I') {
                    statusBg = 'bg-amber-50 text-amber-800';
                    statusLabel = 'Izin';
                  } else if (r.status === 'A') {
                    statusBg = 'bg-rose-50 text-rose-800';
                    statusLabel = 'Alpa';
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.studentNis}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{r.studentName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${statusBg}`}>
                          {r.status} - {statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{r.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
