const express = require('express');
const User = require('../models/User');
const { protect, providerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/providers/all - Returns verified providers with real ratings and populated categories
router.get('/all', async (req, res) => {
  try {
    const providers = await User.find({ 
      role: 'provider',
      'providerProfile.isVerified': true,
      'providerProfile.isBlocked': false
    })
    .select('-password')
    .populate('providerProfile.category', 'name description icon');

    // Get reviews for each provider
    const Review = require('../models/Review');
    
    const formattedProviders = await Promise.all(providers.map(async (provider) => {
      const reviews = await Review.find({ provider: provider._id, isApproved: true });
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        _id: provider._id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        category: provider.providerProfile?.category?.name || 'Service Provider',
        categoryId: provider.providerProfile?.category?._id || null,
        experience: provider.providerProfile?.experience || 0,
        location: provider.providerProfile?.location || '',
        description: provider.providerProfile?.description || '',
        pricePerService: provider.providerProfile?.pricePerService || 0,
        isVerified: provider.providerProfile?.isVerified || false,
        rating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        providerProfile: {
          ...provider.providerProfile.toObject(),
          category: provider.providerProfile?.category
        }
      };
    }));

    res.json({ success: true, data: formattedProviders, count: formattedProviders.length });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single provider
router.get('/:id', async (req, res) => {
  try {
    const provider = await User.findOne({ _id: req.params.id, role: 'provider' })
      .select('name email phone providerProfile')
      .populate('providerProfile.category', 'name description icon');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    // Get reviews
    const Review = require('../models/Review');
    const reviews = await Review.find({ provider: provider._id, isApproved: true })
      .populate('user', 'name email')
      .sort('-createdAt');
    
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    res.json({ 
      success: true, 
      data: {
        ...provider.toObject(),
        rating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search providers with filters
router.get('/search', async (req, res) => {
  try {
    const { location, category, minPrice, maxPrice, searchTerm } = req.query;
    
    let query = {
      role: 'provider',
      'providerProfile.isVerified': true,
      'providerProfile.isBlocked': false
    };
    
    if (location) {
      query['providerProfile.location'] = { $regex: location, $options: 'i' };
    }
    
    if (category) {
      const Category = require('../models/Category');
      const categoryDoc = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (categoryDoc) {
        query['providerProfile.category'] = categoryDoc._id;
      }
    }
    
    if (minPrice || maxPrice) {
      query['providerProfile.pricePerService'] = {};
      if (minPrice) query['providerProfile.pricePerService'].$gte = parseInt(minPrice);
      if (maxPrice) query['providerProfile.pricePerService'].$lte = parseInt(maxPrice);
    }
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'providerProfile.location': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    const providers = await User.find(query)
      .select('name email phone providerProfile')
      .populate('providerProfile.category', 'name');
    
    const Review = require('../models/Review');
    const formattedProviders = await Promise.all(providers.map(async (provider) => {
      const reviews = await Review.find({ provider: provider._id, isApproved: true });
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        _id: provider._id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        category: provider.providerProfile?.category?.name || 'Service Provider',
        experience: provider.providerProfile?.experience || 0,
        location: provider.providerProfile?.location || '',
        description: provider.providerProfile?.description || '',
        pricePerService: provider.providerProfile?.pricePerService || 0,
        isVerified: provider.providerProfile?.isVerified || false,
        rating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length
      };
    }));
    
    res.json({ success: true, data: formattedProviders, count: formattedProviders.length });
  } catch (error) {
    console.error('Error searching providers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Provider stats (protected)
router.get('/stats', protect, providerOnly, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const Review = require('../models/Review');
    
    const totalBookings = await Booking.countDocuments({ provider: req.user._id });
    const completedBookings = await Booking.countDocuments({ provider: req.user._id, status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ provider: req.user._id, status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ provider: req.user._id, status: 'cancelled' });
    
    const reviews = await Review.find({ provider: req.user._id, isApproved: true });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    
    // Calculate earnings
    const completedBookingsData = await Booking.find({ 
      provider: req.user._id, 
      status: 'completed' 
    });
    const totalRevenue = completedBookingsData.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const platformCommission = totalRevenue * (process.env.COMMISSION_RATE || 0.10);
    const netEarnings = totalRevenue - platformCommission;
    
    res.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        averageRating: avgRating.toFixed(1),
        totalReviews: reviews.length,
        totalRevenue,
        platformCommission,
        netEarnings
      }
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;