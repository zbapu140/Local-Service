import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

export default function OTPModal({ email, onVerify, onCancel, isOpen }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen && countdown === 0) {
      setCountdown(60); // 60 seconds cooldown
      const timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post('/otp/verify-otp', { email, otp: otpString });
      console.log('Verification response:', res.data);
      if (res.data.success && res.data.emailVerificationToken) {
        toast.success('Email verified!');
        onVerify(res.data.emailVerificationToken);
      } else {
        throw new Error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
      toast.error(errorMsg);
      // Clear OTP inputs on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) {
      toast.warning(`Please wait ${countdown} seconds before resending`);
      return;
    }
    setResendLoading(true);
    try {
      const res = await axiosClient.post('/otp/send-otp', { email });
      toast.success(res.data.message || 'OTP resent to your email');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } catch (err) {
      console.error('Resend error:', err);
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-4">
          We've sent a 6-digit OTP to <strong>{email}</strong>
        </p>
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="text"
              maxLength="1"
              className="w-12 h-12 text-center text-2xl border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={digit}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && idx > 0) {
                  inputRefs.current[idx - 1]?.focus();
                }
              }}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={handleResend}
            disabled={resendLoading || countdown > 0}
            className="text-indigo-600 text-sm hover:underline disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}