'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'employees' | 'salary'>('attendance');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Tambah Pegawai
  const [newNama, setNewNama] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newGaji, setNewGaji] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data pegawai (beserta gaji yang langsung nempel di tabel employees)
      const { data: empData } = await supabase.from('employees').select('*');
      const empMap = new Map();
      if (empData) {
        setEmployees(empData);
        empData.forEach((emp) => empMap.set(emp.id, emp.nama || emp.name));
      }

      // 2. Ambil data absensi
      const { data: attData } = await supabase.from('attendance').select('*');
      if (attData) {
        const formattedAtt = attData.map((item) => {
          const namaPegawai = empMap.get(item.employee_id) || item.nama_pegawai || item.nama || 'Pegawai';
          let statusAbsen = item.status || item.type;
          if (statusAbsen === 'IN') statusAbsen = 'Masuk';
          if (statusAbsen === 'OUT') statusAbsen = 'Pulang';

          return {
            ...item,
            nama_pegawai: namaPegawai,
            status: statusAbsen,
            timestamp: item.timestamp || item.created_at,
          };
        });

        formattedAtt.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setAttendance(formattedAtt);
      }

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
      .insert([{ 
        nama: newNama, 
        jabatan: newJabatan || 'Staff', 
        pin: newPin,
        gaji_pokok: Number(newGaji) || 1200000,
        potongan: 0
      }]);

    if (error) {
      alert('Gagal menambah pegawai: ' + error.message);
    } else {
      alert('Pegawai berhasil ditambahkan!');
      setNewNama('');
      setNewJabatan('');
      setNewPin('');
      setNewGaji('');
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
            <div className="p-4 border-b border-slate-700 font-semibold text-lg flex justify-between items-center">
              <span>Daftar Kehadiran Masuk & Pulang</span>
              <span className="text-xs text-slate-400">Total: {attendance.length} catatan</span>
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
                    attendance.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-700/30">
                        <td className="p-3 font-medium">{item.nama_pegawai}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.status === 'Masuk' || item.status === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-xs">
                          {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Lokasi GPS'}
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
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    value={newGaji}
                    onChange={(e) => setNewGaji(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: 1200000"
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
                      <th className="p-3">Gaji Pokok</th>
                      <th className="p-3">PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Belum ada data pegawai.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-700/30">
                          <td className="p-3 font-medium">{emp.nama || emp.name || '-'}</td>
                          <td className="p-3 text-slate-300">{emp.jabatan || emp.role || '-'}</td>
                          <td className="p-3 text-emerald-400">Rp {Number(emp.gaji_pokok || 1200000).toLocaleString('id-ID')}</td>
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
                Terhubung ke Tabel Pegawai
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Nama Pegawai</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Gaji Pokok</th>
                    <th className="p-3">Potongan</th>
                    <th className="p-3">Total Gaji Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        Belum ada data pegawai.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                      const pokok = Number(emp.gaji_pokok || 1200000);
                      const potongan = Number(emp.potongan || 0);
                      const bersih = pokok - potongan;
                      const namaEmp = emp.nama || emp.name || `Pegawai ${index + 1}`;
                      return (
                        <tr key={emp.id || index} className="hover:bg-slate-700/30">
                          <td className="p-3 font-medium">{namaEmp}</td>
                          <td className="p-3 text-slate-300">{emp.jabatan || 'Staff'}</td>
                          <td className="p-3 text-slate-300">
                            Rp {pokok.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-rose-400">
                            - Rp {potongan.toLocaleString('id-ID')}
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