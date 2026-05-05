import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ providers: 0, verifiedProviders: 0, pendingWithdrawals: 0, totalWithdrawals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [providersRes, withdrawalsRes] = await Promise.all([
        axiosClient.get('/admin/providers'),
        axiosClient.get('/admin/withdrawals')
      ]);
      const providers = providersRes.data.data;
      const withdrawals = withdrawalsRes.data.data;
      setStats({
        providers: providers.length,
        verifiedProviders: providers.filter(p => p.providerProfile?.isVerified).length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        totalWithdrawals: withdrawals.length
      });
    } catch (err) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Total Providers</p>
          <p className="text-3xl font-bold">{stats.providers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Verified Providers</p>
          <p className="text-3xl font-bold text-green-600">{stats.verifiedProviders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Pending Withdrawals</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingWithdrawals}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Total Withdrawals</p>
          <p className="text-3xl font-bold">{stats.totalWithdrawals}</p>
        </div>
      </div>
    </div>
  );
}