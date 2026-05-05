import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      const url = filter === 'all' ? '/admin/withdrawals' : `/admin/withdrawals?status=${filter}`;
      const res = await axiosClient.get(url);
      setWithdrawals(res.data.data);
    } catch (err) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, action) => {
    try {
      let endpoint = '';
      if (action === 'process') endpoint = `/withdrawals/${id}/process`;
      else if (action === 'complete') endpoint = `/withdrawals/${id}/complete`;
      else if (action === 'reject') endpoint = `/withdrawals/${id}/reject`;
      await axiosClient.put(endpoint);
      toast.success(`Withdrawal ${action}ed`);
      fetchWithdrawals();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100';
  };

  if (loading) return <div className="p-8 text-center">Loading withdrawals...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Withdrawal Requests</h1>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>All</button>
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Pending</button>
        <button onClick={() => setFilter('processing')} className={`px-4 py-2 rounded ${filter === 'processing' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Processing</button>
        <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Completed</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Provider</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Method</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w._id} className="border-t">
                <td className="p-4">{w.provider?.name} <br/><span className="text-xs text-gray-500">{w.provider?.email}</span></td>
                <td className="p-4 font-bold">₹{w.amount}</td>
                <td className="p-4 capitalize">{w.method}</td>
                <td className="p-4">{new Date(w.createdAt).toLocaleDateString()}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(w.status)}`}>{w.status}</span></td>
                <td className="p-4 space-x-2">
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(w._id, 'process')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Process</button>
                      <button onClick={() => updateStatus(w._id, 'reject')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                    </>
                  )}
                  {w.status === 'processing' && (
                    <button onClick={() => updateStatus(w._id, 'complete')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Completed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}