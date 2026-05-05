const express = require('express');
const { sendOTP, verifyOTP, debugGetOTP } = require('../controllers/otpController');
const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Debug route - only in development
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-get-otp', debugGetOTP);
}

module.exports = router;