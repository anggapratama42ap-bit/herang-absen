'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, CheckCircle2, AlertCircle, LogOut, History } from 'lucide-react';

export default function Home() {
  const [pin, setPin] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchHistory(user.id);
    }
  }, [user]);

  // Ambil riwayat absensi pegawai
  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setHistory(data);
    }
  };

  // Fungsi Login / Verifikasi PIN Pegawai
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('pin', pin)
        .single();

      if (error || !data) {
        setError('PIN tidak ditemukan atau salah!');
      } else {
        setUser(data);
        setMessage(`Selamat datang, ${data.name}!`);
      }
    } catch (err) {
      setError('Terjadi kesalahan pada sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Melakukan Absensi (Masuk / Pulang)
  const handleAttendance = async (type: 'IN' | 'OUT') => {
    setLoading(true);
    setError('');
    setMessage('');

    if (!navigator.geolocation) {
      setError('Browser tidak mendukung Geolocation.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const { error: insertError } = await supabase.from('attendance').insert([
          {
            employee_id: user.id,
            type: type,
            latitude: lat,
            longitude: lng,
          },
        ]);

        if (insertError) {
          setError('Gagal menyimpan absensi: ' + insertError.message);
        } else {
          setMessage(`Berhasil melakukan Absen ${type === 'IN' ? 'Masuk' : 'Pulang'}!`);
          fetchHistory(user.id); // Refresh riwayat otomatis
        }
        setLoading(false);
      },
      (err) => {
        setError('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif.');
        setLoading(false);
      }
    );
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-wide text-emerald-400">Herang Absen</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Absensi Pegawai Mandiri</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 text-rose-300 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {!user ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Masukkan PIN Pegawai
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl tracking-widest text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition duration-200 shadow-lg"
            >
              {loading ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
              <p className="text-sm text-slate-400">Pegawai Aktif</p>
              <h2 className="text-xl font-bold text-white mt-1">{user.name}</h2>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                {user.role || 'Staff'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAttendance('IN')}
                disabled={loading}
                className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-md"
              >
                <Clock size={22} />
                <span>Absen Masuk</span>
              </button>
              <button
                onClick={() => handleAttendance('OUT')}
                disabled={loading}
                className="py-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl flex flex-col items-center justify-center gap-2 transition shadow-md"
              >
                <LogOut size={22} />
                <span>Absen Pulang</span>
              </button>
            </div>

            {/* Bagian Riwayat Absensi */}
            <div className="mt-6 border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-3 text-slate-300 text-sm font-semibold">
                <History size={16} />
                <span>Riwayat Kehadiran Terakhir</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">Belum ada riwayat absensi.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/40 text-xs">
                      <span className={`px-2 py-0.5 rounded font-medium ${item.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {item.type === 'IN' ? 'Masuk' : 'Pulang'}
                      </span>
                      <span className="text-slate-400">
                        {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setUser(null);
                setPin('');
                setMessage('');
                setError('');
                setHistory([]);
              }}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-xl transition"
            >
              Keluar / Ganti Akun
            </button>
          </div>
        )}
      </div>
    </main>
  );
}