'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'employees' | 'salary'>('attendance');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Tambah Pegawai
  const [newNama, setNewNama] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newPin, setNewPin] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil data absensi
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .order('timestamp', { ascending: false });
      if (attData) setAttendance(attData);

      // Ambil data pegawai
      const { data: empData } = await supabase
        .from('employees')
        .select('*');
      if (empData) setEmployees(empData);

      // Ambil data gaji
      const { data: salData } = await supabase
        .from('gaji_pegawai')
        .select('*');
      if (salData) setSalaries(salData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newPin) {
      alert('Nama dan PIN wajib diisi!');
      return;
    }

    const { error } = await supabase
      .from('employees')
      .insert([{ nama: newNama, jabatan: newJabatan || 'Staff', pin: newPin }]);

    if (error) {
      alert('Gagal menambah pegawai: ' + error.message);
    } else {
      alert('Pegawai berhasil ditambahkan!');
      setNewNama('');
      setNewJabatan('');
      setNewPin('');
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Dashboard Admin</h1>
            <p className="text-sm text-slate-400">Herang Absen & Laundry - Panel Kontrol</p>
          </div>
          <button
            onClick={fetchData}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Muat Ulang Data
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex space-x-2 mb-6 border-b border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Rekap Kehadiran
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === 'employees'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Manajemen Pegawai ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === 'salary'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Rekap Gaji
          </button>
        </div>

        {/* Konten Tab Rekap Kehadiran */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-700 font-semibold text-lg">
              Daftar Kehadiran Masuk & Pulang
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Nama Pegawai</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Waktu Absen</th>
                    <th className="p-3">Koordinat GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        Belum ada data kehadiran.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-700/30">
                        <td className="p-3 font-medium">{item.nama_pegawai}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.status === 'Masuk'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {new Date(item.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-xs">
                          {item.latitude}, {item.longitude}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Konten Tab Manajemen Pegawai */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Tambah */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg h-fit">
              <h2 className="text-lg font-semibold mb-4 text-emerald-400">Tambah Pegawai Baru</h2>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: Budi"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jabatan / Bagian</label>
                  <input
                    type="text"
                    value={newJabatan}
                    onChange={(e) => setNewJabatan(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: Kasir / Setrika"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">PIN Absen (Angka)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: 123456"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-sm transition"
                >
                  Simpan Pegawai
                </button>
              </form>
            </div>

            {/* List Pegawai */}
            <div className="md:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-700 font-semibold text-lg">
                Daftar Pegawai Terdaftar
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-700/50 text-slate-300 text-sm">
                      <th className="p-3">Nama</th>
                      <th className="p-3">Jabatan</th>
                      <th className="p-3">PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">
                          Belum ada data pegawai.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-700/30">
                          <td className="p-3 font-medium">{emp.nama}</td>
                          <td className="p-3 text-slate-300">{emp.jabatan}</td>
                          <td className="p-3 font-mono text-xs text-slate-400">••••••</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Konten Tab Rekap Gaji */}
        {activeTab === 'salary' && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-700 font-semibold text-lg flex justify-between items-center">
              <span>Rekapitulasi Gaji Pegawai</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                Otomatis dari Database
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Nama Pegawai</th>
                    <th className="p-3">Gaji Pokok</th>
                    <th className="p-3">Potongan</th>
                    <th className="p-3">Total Gaji Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {salaries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        Belum ada data gaji di tabel Supabase.
                      </td>
                    </tr>
                  ) : (
                    salaries.map((sal) => {
                      const bersih = Number(sal.gaji_pokok || 0) - Number(sal.potongan || 0);
                      return (
                        <tr key={sal.id} className="hover:bg-slate-700/30">
                          <td className="p-3 font-medium">{sal.nama_pegawai}</td>
                          <td className="p-3 text-slate-300">
                            Rp {Number(sal.gaji_pokok || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-rose-400">
                            - Rp {Number(sal.potongan || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 font-semibold text-emerald-400">
                            Rp {bersih.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}