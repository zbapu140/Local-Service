const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

const router = express.Router();

// All routes require admin
router.use(protect, adminOnly);

// Get all providers (with verification status)
router.get('/providers', async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' })
      .select('name email phone providerProfile createdAt')
      .populate('providerProfile.category', 'name');
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify a provider
router.put('/providers/:id/verify', async (req, res) => {
  try {
    const provider = await User.findById(req.params.id);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    provider.providerProfile.isVerified = true;
    await provider.save();
    res.json({ success: true, message: 'Provider verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Block/Unblock provider
router.put('/providers/:id/block', async (req, res) => {
  try {
    const provider = await User.findById(req.params.id);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    provider.providerProfile.isBlocked = !provider.providerProfile.isBlocked;
    await provider.save();
    res.json({ success: true, message: `Provider ${provider.providerProfile.isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all withdrawal requests (with filters)
router.get('/withdrawals', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const withdrawals = await Withdrawal.find(filter)
      .populate('provider', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;