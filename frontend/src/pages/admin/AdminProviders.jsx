import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await axiosClient.get('/admin/providers');
      setProviders(res.data.data);
    } catch (err) {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async (id) => {
    try {
      await axiosClient.put(`/admin/providers/${id}/verify`);
      toast.success('Provider verified');
      fetchProviders();
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const toggleBlock = async (id, isBlocked) => {
    try {
      await axiosClient.put(`/admin/providers/${id}/block`);
      toast.success(`Provider ${isBlocked ? 'unblocked' : 'blocked'}`);
      fetchProviders();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading providers...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Providers</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Location</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider._id} className="border-t">
                <td className="p-4">{provider.name}</td>
                <td className="p-4">{provider.email}</td>
                <td className="p-4">{provider.providerProfile?.category?.name || '—'}</td>
                <td className="p-4">{provider.providerProfile?.location || '—'}</td>
                <td className="p-4">
                  {provider.providerProfile?.isVerified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Pending</span>
                  )}
                  {provider.providerProfile?.isBlocked && (
                    <span className="ml-2 text-red-600">Blocked</span>
                  )}
                </td>
                <td className="p-4 space-x-2">
                  {!provider.providerProfile?.isVerified && (
                    <button onClick={() => verifyProvider(provider._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Verify</button>
                  )}
                  <button onClick={() => toggleBlock(provider._id, provider.providerProfile?.isBlocked)} className={`px-3 py-1 rounded text-sm ${provider.providerProfile?.isBlocked ? 'bg-gray-600' : 'bg-red-600'} text-white`}>
                    {provider.providerProfile?.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}