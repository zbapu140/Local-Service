import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/booking/provider");
      if (res.data.success) setBookings(res.data.data);
      else setBookings([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    setUpdating(true);
    try {
      const res = await axiosClient.put(`/booking/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Booking ${newStatus} successfully!`);
        fetchBookings();
      } else toast.error(res.data.message || "Failed to update status");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const updatePaymentStatus = async (bookingId, paymentStatus) => {
    setUpdating(true);
    try {
      const res = await axiosClient.put(`/booking/${bookingId}/payment-status`, { paymentStatus });
      if (res.data.success) {
        toast.success(`Payment marked as ${paymentStatus}`);
        fetchBookings();
      } else toast.error(res.data.message || "Failed to update payment status");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update payment status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(booking => activeTab === "all" ? true : booking.status === activeTab);
  const counts = {
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    completed: bookings.filter(b => b.status === "completed").length,
    all: bookings.length,
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-blue-100 text-blue-700",
      in_progress: "bg-purple-100 text-purple-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      declined: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100";
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="ml-64 p-8 flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-800">Service Requests</h1><p className="text-gray-500 text-sm">Manage your bookings and service requests</p></div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab("pending")} className={`py-2 px-1 border-b-2 font-medium text-sm transition ${activeTab === "pending" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Pending ({counts.pending})</button>
          <button onClick={() => setActiveTab("accepted")} className={`py-2 px-1 border-b-2 font-medium text-sm transition ${activeTab === "accepted" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Accepted ({counts.accepted})</button>
          <button onClick={() => setActiveTab("completed")} className={`py-2 px-1 border-b-2 font-medium text-sm transition ${activeTab === "completed" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Completed ({counts.completed})</button>
          <button onClick={() => setActiveTab("all")} className={`py-2 px-1 border-b-2 font-medium text-sm transition ${activeTab === "all" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>All ({counts.all})</button>
        </nav>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm"><div className="text-6xl mb-4">📭</div><h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3><p className="text-gray-500">No bookings available.</p></div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="text-lg font-bold text-gray-800">{booking.user?.name || "Customer"}</h3><p className="text-sm text-gray-500">{booking.user?.email || "No email provided"}</p></div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.status)}`}>{booking.status?.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-xs text-gray-500 mb-1">Service</p><p className="font-medium text-gray-700">{booking.service?.title || "Service"}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Amount</p><p className="font-bold text-green-600">₹{booking.totalAmount || 0}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Date</p><p className="text-gray-700">{formatDate(booking.date)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Time</p><p className="text-gray-700">{booking.time}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Payment</p><p className="text-gray-700">{booking.paymentMethod === 'razorpay' ? 'Online (Paid)' : `Cash - ${booking.paymentStatus}`}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Address</p><p className="text-gray-700 text-sm">{booking.address}</p></div>
                  {booking.notes && <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-gray-700 text-sm italic">{booking.notes}</p></div>}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {booking.status === "pending" && (
                    <>
                      <button onClick={() => updateBookingStatus(booking._id, "accepted")} disabled={updating} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">Accept Request</button>
                      <button onClick={() => updateBookingStatus(booking._id, "declined")} disabled={updating} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">Decline</button>
                    </>
                  )}
                  {booking.status === "accepted" && (
                    <>
                      <button onClick={() => updateBookingStatus(booking._id, "in_progress")} disabled={updating} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">Start Service</button>
                      <button onClick={() => updateBookingStatus(booking._id, "cancelled")} disabled={updating} className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50">Cancel</button>
                    </>
                  )}
                  {booking.status === "in_progress" && (
                    <button onClick={() => updateBookingStatus(booking._id, "completed")} disabled={updating} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">Mark as Completed</button>
                  )}
                  {booking.status === "completed" && booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                    <button onClick={() => updatePaymentStatus(booking._id, 'completed')} disabled={updating} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">Mark Payment Received</button>
                  )}
                  {booking.status === "completed" && booking.paymentMethod === 'cash' && booking.paymentStatus === 'completed' && (
                    <div className="w-full text-center text-green-600 font-medium">✓ Payment Received</div>
                  )}
                  {booking.status === "completed" && booking.paymentMethod === 'razorpay' && (
                    <div className="w-full text-center text-green-600 font-medium">✓ Online Payment Completed</div>
                  )}
                  {booking.status === "cancelled" && <div className="w-full text-center text-red-600 font-medium">✗ Booking Cancelled</div>}
                  {booking.status === "declined" && <div className="w-full text-center text-gray-600 font-medium">Request Declined</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}