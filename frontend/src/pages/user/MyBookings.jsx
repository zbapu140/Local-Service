import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await axiosClient.get("/booking/my");
      setBookings(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const submitReview = async () => {
    try {
      const res = await axiosClient.post("/review/add", {
        bookingId: selectedBooking._id,
        rating,
        comment
      });
      if (res.data.success) {
        toast.success(res.data.message || "Review submitted successfully!");
        setShowModal(false);
        setComment("");
        setRating(5);
        fetchBookings();
      } else {
        toast.error(res.data.message || "Error submitting review");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting review");
    }
  };

  // Payment for online booking after service completion
  const handlePayNow = async (booking) => {
    setProcessingPayment(true);
    try {
      // 1. Create Razorpay order
      const orderRes = await axiosClient.post("/payments/create-order-for-booking", {
        bookingId: booking._id
      });
      const { order, bookingAmount } = orderRes.data;

      // 2. Load Razorpay script
      const loadScript = () => {
        return new Promise((resolve) => {
          if (document.getElementById("razorpay-script")) {
            resolve(true);
            return;
          }
          const script = document.createElement("script");
          script.id = "razorpay-script";
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };
      const scriptLoaded = await loadScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway failed to load. Please try again later.");
        setProcessingPayment(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "LocalServe",
        description: `Payment for ${booking.service?.title || "Service"}`,
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await axiosClient.post("/payments/verify", {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            bookingId: booking._id,
          });
          if (verifyRes.data.success) {
            toast.success("Payment successful!");
            fetchBookings(); // refresh to show paid status
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
          setProcessingPayment(false);
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user")).name,
          email: JSON.parse(localStorage.getItem("user")).email,
        },
        theme: { color: "#4F46E5" },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
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

  return (
    <div className="ml-64 p-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{booking.service?.title || "Unknown Service"}</p>
                  <p className="text-sm text-gray-600">Provider: {booking.provider?.name}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(booking.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Amount: ₹{booking.totalAmount}</p>
                  <p className="text-sm">Payment: {booking.paymentMethod === 'razorpay' ? 'Online' : 'Cash'} - 
                    <span className={booking.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                      {booking.paymentStatus === 'completed' ? ' Paid' : ' Pending'}
                    </span>
                  </p>
                  <p className="text-sm">
                    Status: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>{booking.status}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {booking.status === "completed" && booking.paymentMethod === "razorpay" && booking.paymentStatus !== "completed" && (
                    <button
                      onClick={() => handlePayNow(booking)}
                      disabled={processingPayment}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {processingPayment ? "Processing..." : "Pay Now"}
                    </button>
                  )}
                  {booking.status === "completed" && !booking.hasReviewed && (
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Rate your Experience</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating (1-5 Stars)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={`text-2xl ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}>★</button>
                ))}
              </div>
            </div>
            <textarea
              className="w-full border p-3 rounded-lg mb-4 h-32 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="How was the service? What did you like?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              <button onClick={submitReview} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}