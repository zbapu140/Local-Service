const express = require('express');
const {
  requestWithdrawal,
  getMyWithdrawals,
  getWithdrawalSummary,
  cancelWithdrawal,
  savePaymentDetails,
  getPaymentDetails,
  processWithdrawal,
  completeWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');
const { protect, providerOnly, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Provider-only routes
router.post('/request', protect, providerOnly, requestWithdrawal);
router.get('/my', protect, providerOnly, getMyWithdrawals);
router.get('/summary', protect, providerOnly, getWithdrawalSummary);
router.put('/:id/cancel', protect, providerOnly, cancelWithdrawal);
router.get('/payment-details', protect, providerOnly, getPaymentDetails);
router.post('/save-payment-details', protect, providerOnly, savePaymentDetails);

// Admin-only routes
router.put('/:id/process', protect, adminOnly, processWithdrawal);
router.put('/:id/complete', protect, adminOnly, completeWithdrawal);
router.put('/:id/reject', protect, adminOnly, rejectWithdrawal);

module.exports = router;