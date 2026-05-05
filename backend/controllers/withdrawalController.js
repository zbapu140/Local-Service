const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// @desc    Request withdrawal with payment details
// @route   POST /api/withdrawals/request
// @access  Private/Provider
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, paymentDetails } = req.body;

    // Validate amount
    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹500',
      });
    }

    // Get provider's available balance
    const provider = await User.findById(req.user._id);
    const availableBalance = await calculateProviderBalance(req.user._id);

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${availableBalance}`,
      });
    }

    // Validate payment details based on method
    let withdrawalData = {
      provider: req.user._id,
      amount,
      method,
      status: 'pending',
    };

    switch (method) {
      case 'upi':
        if (!paymentDetails?.upiId) {
          return res.status(400).json({
            success: false,
            message: 'UPI ID is required',
          });
        }
        withdrawalData.upiDetails = {
          upiId: paymentDetails.upiId,
          upiName: paymentDetails.upiName || req.user.name,
        };
        break;

      case 'bank':
        if (!paymentDetails?.accountNumber || !paymentDetails?.ifscCode) {
          return res.status(400).json({
            success: false,
            message: 'Bank account details are required',
          });
        }
        withdrawalData.bankDetails = {
          accountNumber: paymentDetails.accountNumber,
          ifscCode: paymentDetails.ifscCode.toUpperCase(),
          bankName: paymentDetails.bankName,
          accountHolderName: paymentDetails.accountHolderName || req.user.name,
        };
        break;

      case 'wallet':
        if (!paymentDetails?.walletType || !paymentDetails?.walletId) {
          return res.status(400).json({
            success: false,
            message: 'Wallet details are required',
          });
        }
        withdrawalData.walletDetails = {
          walletType: paymentDetails.walletType,
          walletId: paymentDetails.walletId,
          mobileNumber: paymentDetails.mobileNumber,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid withdrawal method',
        });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create(withdrawalData);

    // Generate transaction ID
    withdrawal.transactionId = generateTransactionId(withdrawal._id);
    await withdrawal.save();

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request submitted successfully',
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get provider withdrawals with filters
// @route   GET /api/withdrawals/my
// @access  Private/Provider
const getMyWithdrawals = async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50, page = 1 } = req.query;

    let query = { provider: req.user._id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const withdrawals = await Withdrawal.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    // Calculate summary
    const summary = {
      totalWithdrawn: withdrawals.reduce((sum, w) => 
        w.status === 'completed' ? sum + w.amount : sum, 0),
      pendingAmount: withdrawals.reduce((sum, w) => 
        w.status === 'pending' ? sum + w.amount : sum, 0),
      processingAmount: withdrawals.reduce((sum, w) => 
        w.status === 'processing' ? sum + w.amount : sum, 0),
      totalRequests: withdrawals.length,
    };

    res.json({
      success: true,
      data: withdrawals,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get withdrawal summary
// @route   GET /api/withdrawals/summary
// @access  Private/Provider
const getWithdrawalSummary = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ provider: req.user._id });

    const summary = {
      totalWithdrawn: withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0),
      pendingWithdrawals: withdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0),
      processingWithdrawals: withdrawals
        .filter(w => w.status === 'processing')
        .reduce((sum, w) => sum + w.amount, 0),
      failedWithdrawals: withdrawals
        .filter(w => w.status === 'failed')
        .reduce((sum, w) => sum + w.amount, 0),
      totalRequests: withdrawals.length,
      lastWithdrawal: withdrawals
        .filter(w => w.status === 'completed')
        .sort((a, b) => b.processedAt - a.processedAt)[0] || null,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get withdrawal summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel withdrawal request
// @route   PUT /api/withdrawals/:id/cancel
// @access  Private/Provider
const cancelWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    // Check if user owns this withdrawal
    if (withdrawal.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request',
      });
    }

    // Only pending withdrawals can be cancelled
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel withdrawal in ${withdrawal.status} status`,
      });
    }

    withdrawal.status = 'cancelled';
    withdrawal.notes = 'Cancelled by provider';
    await withdrawal.save();

    res.json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Save payment details for future withdrawals
// @route   POST /api/withdrawals/save-payment-details
// @access  Private/Provider
const savePaymentDetails = async (req, res) => {
  try {
    const { method, paymentDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.paymentDetails) {
      user.paymentDetails = {};
    }

    switch (method) {
      case 'upi':
        user.paymentDetails.upi = {
          upiId: paymentDetails.upiId,
          upiName: paymentDetails.upiName,
          isDefault: paymentDetails.isDefault || false,
        };
        break;

      case 'bank':
        user.paymentDetails.bank = {
          accountNumber: paymentDetails.accountNumber,
          ifscCode: paymentDetails.ifscCode,
          bankName: paymentDetails.bankName,
          accountHolderName: paymentDetails.accountHolderName,
          isDefault: paymentDetails.isDefault || false,
        };
        break;

      case 'wallet':
        user.paymentDetails.wallet = {
          walletType: paymentDetails.walletType,
          walletId: paymentDetails.walletId,
          mobileNumber: paymentDetails.mobileNumber,
          isDefault: paymentDetails.isDefault || false,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method',
        });
    }

    await user.save();

    res.json({
      success: true,
      data: user.paymentDetails,
      message: 'Payment details saved successfully',
    });
  } catch (error) {
    console.error('Save payment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get saved payment details
// @route   GET /api/withdrawals/payment-details
// @access  Private/Provider
const getPaymentDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('paymentDetails');
    
    res.json({
      success: true,
      data: user.paymentDetails || {},
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to calculate provider balance
const calculateProviderBalance = async (providerId) => {
  const Booking = require('../models/Booking');
  
  const completedBookings = await Booking.find({
    provider: providerId,
    status: 'completed',
  });

  const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  const platformCommission = totalRevenue * 0.10;
  const availableBalance = totalRevenue - platformCommission;

  // Subtract pending withdrawals
  const pendingWithdrawals = await Withdrawal.find({
    provider: providerId,
    status: { $in: ['pending', 'processing'] },
  });

  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  
  return availableBalance - pendingAmount;
};

// Helper function to generate transaction ID
const generateTransactionId = (withdrawalId) => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `WDL-${timestamp}-${random}`;
};

// @desc    Process a withdrawal (admin marks as processing)
// @route   PUT /api/withdrawals/:id/process
// @access  Private/Admin
const processWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not in pending state' });
    }
    withdrawal.status = 'processing';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    res.json({ success: true, data: withdrawal, message: 'Withdrawal marked as processing' });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete a withdrawal (admin marks as completed)
// @route   PUT /api/withdrawals/:id/complete
// @access  Private/Admin
const completeWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'processing') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not in processing state' });
    }
    withdrawal.status = 'completed';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    res.json({ success: true, data: withdrawal, message: 'Withdrawal completed successfully' });
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a withdrawal
// @route   PUT /api/withdrawals/:id/reject
// @access  Private/Admin
const rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending withdrawals can be rejected' });
    }
    withdrawal.status = 'failed';
    withdrawal.rejectionReason = reason || 'Rejected by admin';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    res.json({ success: true, data: withdrawal, message: 'Withdrawal rejected' });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestWithdrawal,
  getMyWithdrawals,
  getWithdrawalSummary,
  cancelWithdrawal,
  savePaymentDetails,
  getPaymentDetails,
  processWithdrawal,
  completeWithdrawal,
  rejectWithdrawal
};