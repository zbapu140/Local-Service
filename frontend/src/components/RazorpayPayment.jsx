import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RazorpayPayment({ amount, bookingId, onSuccess, onFailure }) {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Failed to load payment gateway');
      setProcessing(false);
      return;
    }

    try {
      // Create order
      const orderRes = await axiosClient.post('/payments/create-order', {
        amount,
        bookingId,
      });
      const { order } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'LocalServe',
        description: `Booking Payment`,
        order_id: order.id,
        handler: async (response) => {
          // Verify payment
          const verifyRes = await axiosClient.post('/payments/verify', {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            bookingId,
          });
          if (verifyRes.data.success) {
            toast.success('Payment successful!');
            onSuccess();
          } else {
            toast.error('Payment verification failed');
            onFailure?.();
          }
        },
        prefill: {
          name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : '',
          email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : '',
        },
        theme: { color: '#4F46E5' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error('Payment initialization failed');
      onFailure?.();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={processing}
      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
    >
      {processing ? 'Processing...' : `Pay ₹${amount}`}
    </button>
  );
}