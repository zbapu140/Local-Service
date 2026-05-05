const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { sendBookingNotificationToProvider, sendBookingAcceptanceToProvider, sendBookingAcceptedToUser } = require('../utils/sendEmail');

const createBooking = async (req, res) => {
  try {
    const { serviceId, date, time, address, notes, promotionId, paymentMethod } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    let finalAmount = service.price;
    let promotionObj = null;

    if (promotionId) {
      const Promotion = require('../models/Promotion');
      promotionObj = await Promotion.findById(promotionId);
      if (promotionObj && promotionObj.isActive && new Date(promotionObj.validUntil) > new Date() &&
          promotionObj.provider.toString() === service.provider.toString()) {
        const discount = (service.price * promotionObj.discountPercentage) / 100;
        finalAmount = service.price - discount;
        promotionObj.usageCount += 1;
        await promotionObj.save();
      } else {
        return res.status(400).json({ message: 'Invalid or expired promotion' });
      }
    }

    const booking = await Booking.create({
      user: req.user._id,
      provider: service.provider,
      service: serviceId,
      date,
      time,
      address,
      totalAmount: finalAmount,
      originalAmount: service.price,
      promotionApplied: promotionObj?._id || null,
      notes: notes || '',
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod || 'cash',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('service', 'title price')
      .populate('provider', 'name email')
      .populate('user', 'name email');

    if (populatedBooking.provider && populatedBooking.provider.email) {
      sendBookingNotificationToProvider(
        populatedBooking.provider.email,
        populatedBooking.provider.name,
        {
          serviceTitle: populatedBooking.service.title,
          customerName: populatedBooking.user.name,
          customerEmail: populatedBooking.user.email,
          date: populatedBooking.date.toISOString().split('T')[0],
          time: populatedBooking.time,
          address: populatedBooking.address,
          totalAmount: populatedBooking.totalAmount,
          notes: populatedBooking.notes,
          paymentMethod: populatedBooking.paymentMethod,
        }
      ).catch(err => console.error('Email error:', err));
    }

    res.status(201).json({ success: true, data: populatedBooking, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'title price')
      .populate('provider', 'name email providerProfile')
      .sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate('service', 'title price description')
      .populate('user', 'name email phone')
      .sort('-createdAt');
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && booking.provider.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    booking.status = status;
    await booking.save();

    if (status === 'accepted') {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('service', 'title')
        .populate('provider', 'name email')
        .populate('user', 'name email');
      if (populatedBooking.provider && populatedBooking.provider.email) {
        sendBookingAcceptanceToProvider(
          populatedBooking.provider.email,
          populatedBooking.provider.name,
          {
            serviceTitle: populatedBooking.service.title,
            customerName: populatedBooking.user.name,
            customerEmail: populatedBooking.user.email,
            date: populatedBooking.date.toISOString().split('T')[0],
            time: populatedBooking.time,
            address: populatedBooking.address,
            totalAmount: populatedBooking.totalAmount,
          }
        ).catch(err => console.error('Email error (provider):', err));
      }
      if (populatedBooking.user && populatedBooking.user.email) {
        sendBookingAcceptedToUser(
          populatedBooking.user.email,
          populatedBooking.user.name,
          {
            serviceTitle: populatedBooking.service.title,
            providerName: populatedBooking.provider.name,
            date: populatedBooking.date.toISOString().split('T')[0],
            time: populatedBooking.time,
            address: populatedBooking.address,
            totalAmount: populatedBooking.totalAmount,
          }
        ).catch(err => console.error('Email error (user):', err));
      }
    }
    res.json({ success: true, data: booking, message: 'Booking status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Update payment status (for cash bookings)
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.paymentMethod !== 'cash') {
      return res.status(400).json({ message: 'Payment status can only be updated for cash bookings' });
    }
    if (!['pending', 'completed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    booking.paymentStatus = paymentStatus;
    await booking.save();
    res.json({ success: true, data: booking, message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (booking.status === 'completed') return res.status(400).json({ message: 'Cannot cancel completed booking' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking already cancelled' });
    booking.status = 'cancelled';
    await booking.save();
    res.json({ success: true, data: booking, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('service', 'title price')
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus,
  updatePaymentStatus,
  getAllBookings,
  cancelBooking,
};