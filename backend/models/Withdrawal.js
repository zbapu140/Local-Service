const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 500,
    },
    method: {
      type: String,
      enum: ['upi', 'bank', 'wallet'],
      required: true,
    },
    // UPI Details
    upiDetails: {
      upiId: { type: String, default: '' },
      upiName: { type: String, default: '' },
    },
    // Bank Account Details
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
    },
    // Wallet Details
    walletDetails: {
      walletType: { type: String, enum: ['paytm', 'phonepe', 'googlepay', 'amazonpay'], default: 'paytm' },
      walletId: { type: String, default: '' },
      mobileNumber: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
    processedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
withdrawalSchema.index({ provider: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);