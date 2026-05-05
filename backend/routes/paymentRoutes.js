const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createOrderForBooking, verifyPayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-order-for-booking', protect, createOrderForBooking);
router.post('/verify', protect, verifyPayment);

module.exports = router;