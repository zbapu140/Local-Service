const express = require('express');
const Booking = require('../models/Booking');
const {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  updatePaymentStatus,
  getAllBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, adminOnly, providerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/create', createBooking);
router.get('/my', getUserBookings);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/payment-status', providerOnly, updatePaymentStatus); // NEW

router.get('/provider', providerOnly, getProviderBookings);
router.get('/all', adminOnly, getAllBookings);

// Debug route
router.get('/debug/provider-bookings', protect, providerOnly, async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('user', 'name email')
      .populate('service', 'title');
    res.json({
      providerId: req.user._id,
      providerName: req.user.name,
      totalBookings: bookings.length,
      bookings: bookings.map(b => ({
        id: b._id,
        user: b.user?.name,
        service: b.service?.title,
        status: b.status,
        date: b.date
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;