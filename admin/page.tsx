'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Calendar, ArrowLeft, RefreshCw, UserPlus, Trash2, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'employees'>('attendance');
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State untuk Tambah Pegawai
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('Staff');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAttendanceReport();
    fetchEmployees();
  }, []);

  // Ambil data rekap absensi
  const fetchAttendanceReport = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('attendance')
      .select(`
        id,
        type,
        created_at,
        latitude,
        longitude,
        employees (
          name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setAttendanceList(data);
    setLoading(false);
  };

  // Ambil data daftar pegawai
  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setEmployeesList(data);
  };

  // Tambah Pegawai Baru
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormMessage('');

    if (pin.length < 4) {
      setFormError('PIN minimal harus 4 digit.');
      return;
    }

    const { error } = await supabase.from('employees').insert([
      { name, pin, role }
    ]);

    if (error) {
      setFormError('Gagal menambah pegawai (PIN mungkin sudah digunakan): ' + error.message);
    } else {
      setFormMessage(`Pegawai ${name} berhasil ditambahkan!`);
      setName('');
      setPin('');
      setRole('Staff');
      fetchEmployees();
    }
  };

  // Hapus Pegawai
  const handleDeleteEmployee = async (id: string, employeeName: string) => {
    if (!confirm(`Yakin ingin menghapus pegawai ${employeeName}?`)) return;

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus pegawai: ' + error.message);
    } else {
      fetchEmployees();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigasi */}
        <div className="flex justify-between items-center bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition"
              title="Kembali ke Absensi"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-emerald-400">Dashboard Admin</h1>
              <p className="text-xs text-slate-400">Herang Absen - Panel Kontrol</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchAttendanceReport();
              fetchEmployees();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition shadow-md"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Tombol Tab Navigasi */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Calendar size={18} />
            <span>Rekap Kehadiran</span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'employees'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Users size={18} />
            <span>Manajemen Pegawai ({employeesList.length})</span>
          </button>
        </div>

        {/* KONTEN TAB: REKAP ABSENSI */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2 text-slate-300 font-semibold text-sm">
              <Calendar size={18} />
              <span>Daftar Kehadiran Masuk & Pulang</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider">
                    <th className="p-4">Nama Pegawai</th>
                    <th className="p-4">Jabatan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Waktu Absen</th>
                    <th className="p-4">Koordinat GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Memuat data rekap...
                      </td>
                    </tr>
                  ) : attendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Belum ada data kehadiran tercatat.
                      </td>
                    </tr>
                  ) : (
                    attendanceList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-4 font-semibold text-white">
                          {item.employees?.name || 'Tanpa Nama'}
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600/50">
                            {item.employees?.role || 'Staff'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.type === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.type === 'IN' ? 'Masuk' : 'Pulang'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">
                          {new Date(item.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-mono">
                          {item.latitude && item.longitude
                            ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KONTEN TAB: MANAJEMEN PEGAWAI */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Tambah Pegawai */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl h-fit">
              <h2 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <UserPlus size={18} />
                <span>Tambah Pegawai Baru</span>
              </h2>

              {formError && (
                <div className="mb-3 p-2.5 bg-rose-500/20 border border-rose-500 text-rose-300 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              {formMessage && (
                <div className="mb-3 p-2.5 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs">
                  {formMessage}
                </div>
              )}

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Siti Rahma"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PIN Absen (Unik)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Contoh: 654321"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Jabatan / Peran</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Contoh: Staff Dapur"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-md"
                >
                  Simpan Pegawai
                </button>
              </form>
            </div>

            {/* Daftar Pegawai */}
            <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center gap-2 text-slate-300 font-semibold text-sm">
                <Users size={18} />
                <span>Daftar Seluruh Pegawai</span>
              </div>
              <div className="divide-y divide-slate-700/50 max-h-[420px] overflow-y-auto">
                {employeesList.length === 0 ? (
                  <p className="text-center py-8 text-slate-500 text-sm">Belum ada data pegawai.</p>
                ) : (
                  employeesList.map((emp) => (
                    <div key={emp.id} className="p-4 flex justify-between items-center hover:bg-slate-700/30 transition">
                      <div>
                        <h3 className="font-semibold text-white text-sm">{emp.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600/50">
                            {emp.role}
                          </span>
                          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                            PIN: {emp.pin}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition"
                        title="Hapus Pegawai"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}