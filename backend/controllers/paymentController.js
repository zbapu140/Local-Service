const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order for a completed booking (post-service payment)
const createOrderForBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Payment only available for completed services' });
    }
    if (booking.paymentMethod !== 'razorpay') {
      return res.status(400).json({ success: false, message: 'This booking is not for online payment' });
    }
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    const options = {
      amount: Math.round(booking.totalAmount * 100),
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, bookingAmount: booking.totalAmount });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment (same as before, updates paymentStatus)
const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature, bookingId } = req.body;
    const body = order_id + '|' + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === signature) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        'paymentDetails.order_id': order_id,
        'paymentDetails.payment_id': payment_id,
      });
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrderForBooking, verifyPayment };