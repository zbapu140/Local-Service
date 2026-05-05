const express = require('express');
const {
  addReview,
  getProviderReviews,
  getAllReviews,
  approveReview,
  debugReviews, 
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add', protect, addReview);
router.get('/provider/:providerId', getProviderReviews);
router.get('/all', protect, adminOnly, getAllReviews);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.get('/debug/all', debugReviews); 

module.exports = router;