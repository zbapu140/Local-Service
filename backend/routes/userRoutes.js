const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');

const {
  getUsers,
  getProviders,
  verifyProvider,
  toggleBlockUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getUsers);
router.get('/providers', protect, adminOnly, getProviders);
router.put('/verify-provider/:id', protect, adminOnly, verifyProvider);
router.put('/:id/toggle-block', protect, adminOnly, toggleBlockUser);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;