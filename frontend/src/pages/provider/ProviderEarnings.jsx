import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";

export default function ProviderEarnings() {
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    available: 0,
    platformCommission: 0,
    pending: 0,
    transactions: []
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("upi");
  const [paymentDetails, setPaymentDetails] = useState({
    upi: { upiId: "", upiName: "" },
    bank: { accountNumber: "", ifscCode: "", bankName: "", accountHolderName: "" },
    wallet: { walletType: "paytm", walletId: "", mobileNumber: "" }
  });
  const [savedPaymentDetails, setSavedPaymentDetails] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings");

  useEffect(() => {
    fetchEarnings();
    fetchWithdrawals();
    fetchPaymentDetails();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (user.role !== 'provider') {
        toast.error("You are not logged in as a provider");
        setLoading(false);
        return;
      }

      const bookingsRes = await axiosClient.get(`/booking/provider`);
      
      if (bookingsRes.data.success) {
        const allBookings = bookingsRes.data.data || [];
        const completedBookings = allBookings.filter(booking => booking.status === "completed");
        
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const platformCommission = totalRevenue * 0.10;
        const availableBalance = totalRevenue - platformCommission;
        
        const transactions = completedBookings.map(booking => ({
          id: booking._id,
          date: booking.date,
          customer: booking.user?.name || "Customer",
          amount: booking.totalAmount || 0,
          commission: (booking.totalAmount || 0) * 0.10,
          netAmount: (booking.totalAmount || 0) * 0.90,
          status: "completed",
          service: booking.service?.title || "Service"
        }));
        
        setEarnings({
          totalRevenue,
          available: availableBalance,
          platformCommission,
          pending: 0,
          transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
      }
    } catch (err) {
      console.error("Error fetching earnings:", err);
      toast.error(err.response?.data?.message || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axiosClient.get("/withdrawals/my");
      if (res.data.success) {
        setWithdrawals(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const res = await axiosClient.get("/withdrawals/payment-details");
      if (res.data.success && res.data.data) {
        setSavedPaymentDetails(res.data.data);
        // Pre-fill payment details if saved
        if (res.data.data.upi) {
          setPaymentDetails(prev => ({
            ...prev,
            upi: res.data.data.upi
          }));
        }
        if (res.data.data.bank) {
          setPaymentDetails(prev => ({
            ...prev,
            bank: res.data.data.bank
          }));
        }
        if (res.data.data.wallet) {
          setPaymentDetails(prev => ({
            ...prev,
            wallet: res.data.data.wallet
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > earnings.available) {
      toast.error(`Insufficient balance. Maximum withdrawal: ₹${earnings.available}`);
      return;
    }
    if (withdrawAmount < 500) {
      toast.error("Minimum withdrawal amount is ₹500");
      return;
    }

    // Validate payment details based on method
    let paymentDetailsToSend = {};
    
    switch (withdrawMethod) {
      case "upi":
        if (!paymentDetails.upi.upiId) {
          toast.error("Please enter UPI ID");
          return;
        }
        paymentDetailsToSend = {
          upiId: paymentDetails.upi.upiId,
          upiName: paymentDetails.upi.upiName
        };
        break;
      
      case "bank":
        if (!paymentDetails.bank.accountNumber || !paymentDetails.bank.ifscCode) {
          toast.error("Please enter complete bank details");
          return;
        }
        paymentDetailsToSend = {
          accountNumber: paymentDetails.bank.accountNumber,
          ifscCode: paymentDetails.bank.ifscCode,
          bankName: paymentDetails.bank.bankName,
          accountHolderName: paymentDetails.bank.accountHolderName
        };
        break;
      
      case "wallet":
        if (!paymentDetails.wallet.walletId) {
          toast.error("Please enter wallet ID");
          return;
        }
        paymentDetailsToSend = {
          walletType: paymentDetails.wallet.walletType,
          walletId: paymentDetails.wallet.walletId,
          mobileNumber: paymentDetails.wallet.mobileNumber
        };
        break;
      
      default:
        toast.error("Invalid withdrawal method");
        return;
    }

    setWithdrawing(true);
    try {
      const res = await axiosClient.post("/withdrawals/request", {
        amount: withdrawAmount,
        method: withdrawMethod,
        paymentDetails: paymentDetailsToSend
      });
      
      if (res.data.success) {
        toast.success(`Withdrawal request for ₹${withdrawAmount} submitted successfully!`);
        setWithdrawAmount("");
        setShowWithdrawModal(false);
        fetchEarnings();
        fetchWithdrawals();
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.response?.data?.message || "Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const savePaymentDetails = async () => {
    try {
      let paymentDetailsToSave = {};
      
      switch (withdrawMethod) {
        case "upi":
          paymentDetailsToSave = {
            upiId: paymentDetails.upi.upiId,
            upiName: paymentDetails.upi.upiName
          };
          break;
        case "bank":
          paymentDetailsToSave = {
            accountNumber: paymentDetails.bank.accountNumber,
            ifscCode: paymentDetails.bank.ifscCode,
            bankName: paymentDetails.bank.bankName,
            accountHolderName: paymentDetails.bank.accountHolderName
          };
          break;
        case "wallet":
          paymentDetailsToSave = {
            walletType: paymentDetails.wallet.walletType,
            walletId: paymentDetails.wallet.walletId,
            mobileNumber: paymentDetails.wallet.mobileNumber
          };
          break;
      }
      
      await axiosClient.post("/withdrawals/save-payment-details", {
        method: withdrawMethod,
        paymentDetails: paymentDetailsToSave
      });
      
      toast.success("Payment details saved for future withdrawals!");
    } catch (err) {
      toast.error("Failed to save payment details");
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "completed":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Completed</span>;
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>;
      case "processing":
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Processing</span>;
      case "failed":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Failed</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="ml-64 p-8 flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-8 bg-gray-50 min-h-screen">
      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("earnings")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === "earnings"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Earnings Overview
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === "withdrawals"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Withdrawal History
          </button>
        </nav>
      </div>

      {activeTab === "earnings" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <h2 className="text-3xl font-bold text-gray-800">₹{earnings.totalRevenue.toLocaleString()}</h2>
              <p className="text-xs text-green-600 mt-2">From completed services</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
              <p className="text-gray-500 text-sm">Available Balance</p>
              <h2 className="text-3xl font-bold text-green-600">₹{earnings.available.toLocaleString()}</h2>
              <p className="text-xs text-gray-500 mt-2">After 10% platform commission</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm">Platform Commission (10%)</p>
              <h2 className="text-3xl font-bold text-orange-500">-₹{earnings.platformCommission.toLocaleString()}</h2>
              <p className="text-xs text-gray-500 mt-2">Deducted from total earnings</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <p className="text-gray-500 text-sm">Pending Withdrawals</p>
              <h2 className="text-3xl font-bold text-yellow-600">
                ₹{withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
              </h2>
              <p className="text-xs text-gray-500 mt-2">{withdrawals.filter(w => w.status === 'pending').length} requests pending</p>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={earnings.available < 500}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                earnings.available < 500
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg"
              }`}
            >
              💰 Withdraw Funds (Min ₹500)
            </button>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold">Transaction History</h3>
              <p className="text-sm text-gray-500 mt-1">Earnings from completed services</p>
            </div>
            
            {earnings.transactions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings yet</h3>
                <p className="text-gray-500">Complete services to start earning.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm text-gray-500">
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Commission</th>
                      <th className="p-4">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.transactions.map((tx) => (
                      <tr key={tx.id} className="border-t hover:bg-gray-50">
                        <td className="p-4 text-sm">{formatDate(tx.date)}</td>
                        <td className="p-4 text-sm font-medium">{tx.customer}</td>
                        <td className="p-4 text-sm text-gray-600">{tx.service}</td>
                        <td className="p-4 text-sm font-semibold">₹{tx.amount.toLocaleString()}</td>
                        <td className="p-4 text-sm text-orange-600">-₹{tx.commission.toLocaleString()}</td>
                        <td className="p-4 text-sm font-bold text-green-600">₹{tx.netAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        // Withdrawal History Tab
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold">Withdrawal History</h3>
            <p className="text-sm text-gray-500 mt-1">All your withdrawal requests</p>
          </div>
          
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals yet</h3>
              <p className="text-gray-500">Your withdrawal requests will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-4">Date</th>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="border-t hover:bg-gray-50">
                      <td className="p-4 text-sm">{formatDate(w.createdAt)}</td>
                      <td className="p-4 text-sm font-mono">{w.transactionId}</td>
                      <td className="p-4 text-sm font-bold text-green-600">₹{w.amount.toLocaleString()}</td>
                      <td className="p-4 text-sm capitalize">{w.method}</td>
                      <td className="p-4">{getStatusBadge(w.status)}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {w.method === 'upi' && w.upiDetails?.upiId && (
                          <span>UPI: {w.upiDetails.upiId}</span>
                        )}
                        {w.method === 'bank' && w.bankDetails?.accountNumber && (
                          <span>Bank: ****{w.bankDetails.accountNumber.slice(-4)}</span>
                        )}
                        {w.method === 'wallet' && w.walletDetails?.walletId && (
                          <span>{w.walletDetails.walletType}: {w.walletDetails.walletId}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Request Withdrawal</h2>
            <p className="text-gray-500 mb-6">Available balance: ₹{earnings.available.toLocaleString()}</p>
            
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                  min="500"
                  max={earnings.available}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum: ₹500 | Maximum: ₹{earnings.available.toLocaleString()}</p>
              </div>
              
              {/* Withdrawal Method */}
              <div>
                <label className="block text-sm font-medium mb-2">Withdrawal Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("upi")}
                    className={`p-3 border rounded-lg text-center transition ${
                      withdrawMethod === "upi"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    📱 UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("bank")}
                    className={`p-3 border rounded-lg text-center transition ${
                      withdrawMethod === "bank"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    🏦 Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("wallet")}
                    className={`p-3 border rounded-lg text-center transition ${
                      withdrawMethod === "wallet"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    👛 Digital Wallet
                  </button>
                </div>
              </div>
              
              {/* UPI Details */}
              {withdrawMethod === "upi" && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold">UPI Details</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">UPI ID *</label>
                    <input
                      type="text"
                      value={paymentDetails.upi.upiId}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        upi: { ...paymentDetails.upi, upiId: e.target.value }
                      })}
                      placeholder="example@okhdfcbank"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={paymentDetails.upi.upiName}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        upi: { ...paymentDetails.upi, upiName: e.target.value }
                      })}
                      placeholder="Name as per bank account"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              )}
              
              {/* Bank Details */}
              {withdrawMethod === "bank" && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold">Bank Account Details</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={paymentDetails.bank.accountNumber}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        bank: { ...paymentDetails.bank, accountNumber: e.target.value }
                      })}
                      placeholder="Enter account number"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      value={paymentDetails.bank.ifscCode}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        bank: { ...paymentDetails.bank, ifscCode: e.target.value.toUpperCase() }
                      })}
                      placeholder="Enter IFSC code"
                      className="w-full border rounded-lg p-2 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={paymentDetails.bank.bankName}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        bank: { ...paymentDetails.bank, bankName: e.target.value }
                      })}
                      placeholder="Enter bank name"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={paymentDetails.bank.accountHolderName}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        bank: { ...paymentDetails.bank, accountHolderName: e.target.value }
                      })}
                      placeholder="Enter account holder name"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              )}
              
              {/* Wallet Details */}
              {withdrawMethod === "wallet" && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold">Wallet Details</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wallet Type *</label>
                    <select
                      value={paymentDetails.wallet.walletType}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        wallet: { ...paymentDetails.wallet, walletType: e.target.value }
                      })}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="paytm">Paytm</option>
                      <option value="phonepe">PhonePe</option>
                      <option value="googlepay">Google Pay</option>
                      <option value="amazonpay">Amazon Pay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Wallet ID / UPI ID *</label>
                    <input
                      type="text"
                      value={paymentDetails.wallet.walletId}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        wallet: { ...paymentDetails.wallet, walletId: e.target.value }
                      })}
                      placeholder="Enter wallet ID"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Registered Mobile Number</label>
                    <input
                      type="tel"
                      value={paymentDetails.wallet.mobileNumber}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        wallet: { ...paymentDetails.wallet, mobileNumber: e.target.value }
                      })}
                      placeholder="Enter mobile number"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                </div>
              )}
              
              {/* Save Details Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveDetails"
                  className="w-4 h-4"
                  onChange={(e) => e.target.checked && savePaymentDetails()}
                />
                <label htmlFor="saveDetails" className="text-sm text-gray-600">
                  Save these details for future withdrawals
                </label>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 border py-3 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {withdrawing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    `Request Withdrawal (₹${withdrawAmount || 0})`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}