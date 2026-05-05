const express = require('express');
const {
  createPromotion,
  getProviderPromotions,
  getPromotionById,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  incrementPromotionUsage,
} = require('../controllers/promotionController');
const { protect, providerOnly } = require('../middleware/authMiddleware');
const Promotion = require('../models/Promotion');

const router = express.Router();

// @desc    Get active promotions for a provider (for customers)
// @route   GET /api/promotions/provider/:providerId/active
// @access  Public
router.get('/provider/:providerId/active', async (req, res) => {
  try {
    const promotions = await Promotion.find({
      provider: req.params.providerId,
      isActive: true,
      validUntil: { $gt: new Date() }
    }).select('title description discountPercentage validUntil').sort('-createdAt');

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.use(protect);

// Provider routes
router.post('/create', providerOnly, createPromotion);
router.get('/provider/:providerId', providerOnly, getProviderPromotions);
router.get('/:id', providerOnly, getPromotionById);
router.put('/:id', providerOnly, updatePromotion);
router.put('/:id/toggle-status', providerOnly, togglePromotionStatus);
router.delete('/:id', providerOnly, deletePromotion);

// User routes (for applying promotions)
router.put('/:id/increment-usage', incrementPromotionUsage);

module.exports = router;