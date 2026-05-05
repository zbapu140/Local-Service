const Review = require('../models/Review');
const Booking = require('../models/Booking');

const addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'You can only review completed bookings' });
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    const review = await Review.create({ user: req.user._id, provider: booking.provider, booking: bookingId, rating, comment, isApproved: true });
    const populatedReview = await Review.findById(review._id).populate('user', 'name email').populate('provider', 'name email').populate('booking', 'service');
    res.status(201).json({ success: true, data: populatedReview, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId, isApproved: true }) // FIXED: only approved
      .populate('user', 'name email')
      .populate('booking', 'service')
      .sort('-createdAt');
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    res.json({ success: true, data: reviews, averageRating: avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error('Get provider reviews error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).populate('user', 'name email').populate('provider', 'name email').populate('booking').sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.isApproved = true;
    await review.save();
    res.json({ success: true, message: 'Review approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const debugReviews = async (req, res) => {
  try {
    const allReviews = await Review.find({}).populate('user', 'name email').populate('provider', 'name email').populate('booking');
    res.json({ totalReviews: allReviews.length, reviews: allReviews.map(r => ({ id: r._id, user: r.user?.name, provider: r.provider?.name, rating: r.rating, comment: r.comment, isApproved: r.isApproved })) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addReview, getProviderReviews, getAllReviews, approveReview, debugReviews };