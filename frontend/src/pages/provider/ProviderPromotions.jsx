import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProviderPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    title: "",
    description: "",
    discountPercentage: 0,
    validUntil: "",
    isActive: true
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const providerId = user.id;
      
      console.log("Fetching promotions for provider:", providerId);
      
      const res = await axiosClient.get(`/promotions/provider/${providerId}`);
      console.log("Promotions response:", res.data);
      
      if (res.data.success) {
        setPromotions(res.data.data || []);
      } else {
        setPromotions([]);
      }
    } catch (err) {
      console.error("Error fetching promotions:", err);
      toast.error(err.response?.data?.message || "Failed to load promotions");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!promoForm.title.trim()) {
      toast.error("Please enter promotion title");
      return;
    }
    if (!promoForm.description.trim()) {
      toast.error("Please enter promotion description");
      return;
    }
    if (promoForm.discountPercentage <= 0 || promoForm.discountPercentage > 100) {
      toast.error("Discount must be between 1 and 100");
      return;
    }
    if (!promoForm.validUntil) {
      toast.error("Please select valid until date");
      return;
    }

    try {
      if (editingPromo) {
        // Update existing promotion
        const res = await axiosClient.put(`/promotions/${editingPromo._id}`, promoForm);
        if (res.data.success) {
          toast.success("Promotion updated successfully!");
        }
      } else {
        // Create new promotion
        const res = await axiosClient.post("/promotions/create", promoForm);
        if (res.data.success) {
          toast.success("Promotion created successfully!");
        }
      }
      setShowModal(false);
      setEditingPromo(null);
      setPromoForm({
        title: "",
        description: "",
        discountPercentage: 0,
        validUntil: "",
        isActive: true
      });
      fetchPromotions();
    } catch (err) {
      console.error("Error saving promotion:", err);
      toast.error(err.response?.data?.message || "Failed to save promotion");
    }
  };

  const togglePromoStatus = async (promoId, currentStatus) => {
    try {
      const res = await axiosClient.put(`/promotions/${promoId}/toggle-status`);
      if (res.data.success) {
        toast.success(`Promotion ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchPromotions();
      }
    } catch (err) {
      console.error("Error updating promotion status:", err);
      toast.error(err.response?.data?.message || "Failed to update promotion status");
    }
  };

  const deletePromotion = async (promoId) => {
    if (window.confirm("Are you sure you want to delete this promotion? This action cannot be undone.")) {
      try {
        const res = await axiosClient.delete(`/promotions/${promoId}`);
        if (res.data.success) {
          toast.success("Promotion deleted successfully!");
          fetchPromotions();
        }
      } catch (err) {
        console.error("Error deleting promotion:", err);
        toast.error(err.response?.data?.message || "Failed to delete promotion");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="ml-64 p-8 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promotions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promotions</h1>
          <p className="text-gray-500 text-sm">Create and manage special offers for your customers</p>
        </div>
        <button
          onClick={() => {
            setEditingPromo(null);
            setPromoForm({
              title: "",
              description: "",
              discountPercentage: 0,
              validUntil: "",
              isActive: true
            });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <span>+</span> Create Promotion
        </button>
      </div>

      {/* Stats Cards - Only show if there are promotions */}
      {promotions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm mb-2">Active Promotions</p>
            <span className="text-3xl font-bold text-gray-800">
              {promotions.filter(p => p.isActive && !isExpired(p.validUntil)).length}
            </span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm mb-2">Total Usage</p>
            <span className="text-3xl font-bold text-gray-800">
              {promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
            </span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm mb-2">Average Discount</p>
            <span className="text-3xl font-bold text-green-600">
              {promotions.length > 0 
                ? Math.round(promotions.reduce((sum, p) => sum + p.discountPercentage, 0) / promotions.length)
                : 0}%
            </span>
          </div>
        </div>
      )}

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🏷️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
          <p className="text-gray-500 mb-4">Create your first promotion to attract more customers!</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Promotion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => {
            const expired = isExpired(promo.validUntil);
            const isActive = promo.isActive && !expired;
            
            return (
              <div key={promo._id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition hover:shadow-md ${!isActive ? 'opacity-75' : ''}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{promo.title}</h3>
                        {expired ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Expired</span>
                        ) : isActive ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{promo.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{promo.discountPercentage}%</div>
                      <div className="text-xs text-gray-500">OFF</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
                    <div>
                      <span>Valid until: </span>
                      <span className="font-medium">{formatDate(promo.validUntil)}</span>
                    </div>
                    <div>
                      <span>Used: </span>
                      <span className="font-medium">{promo.usageCount || 0} times</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setEditingPromo(promo);
                        setPromoForm({
                          title: promo.title,
                          description: promo.description,
                          discountPercentage: promo.discountPercentage,
                          validUntil: promo.validUntil?.split('T')[0] || "",
                          isActive: promo.isActive
                        });
                        setShowModal(true);
                      }}
                      disabled={expired}
                      className={`flex-1 px-3 py-2 text-sm border border-indigo-600 text-indigo-600 rounded-lg transition ${
                        expired 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:bg-indigo-50"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => togglePromoStatus(promo._id, isActive)}
                      disabled={expired}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${
                        expired
                          ? "opacity-50 cursor-not-allowed"
                          : isActive
                          ? "border border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                          : "border border-green-600 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deletePromotion(promo._id)}
                      className="px-3 py-2 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Promotion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingPromo ? "Edit Promotion" : "Create New Promotion"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Promotion Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({...promoForm, title: e.target.value})}
                  placeholder="e.g., Weekend Special"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                  placeholder="Describe your promotion..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Percentage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  value={promoForm.discountPercentage}
                  onChange={(e) => setPromoForm({...promoForm, discountPercentage: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 100</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Valid Until <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                  value={promoForm.validUntil}
                  onChange={(e) => setPromoForm({...promoForm, validUntil: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={promoForm.isActive}
                  onChange={(e) => setPromoForm({...promoForm, isActive: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active immediately</label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                >
                  {editingPromo ? "Update" : "Create"} Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}