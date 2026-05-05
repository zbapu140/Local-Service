const Booking = require('../models/Booking');
const User = require('../models/User');

// Get personalized provider recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's past bookings with provider categories
    const bookings = await Booking.find({ user: userId, status: 'completed' })
      .populate('provider')
      .populate('service');

    // Count category preferences
    const categoryCount = {};
    bookings.forEach(booking => {
      const cat = booking.provider?.providerProfile?.category?.toString();
      if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Find top 2 preferred categories
    const topCategories = Object.entries(categoryCount)
      .sort((a,b) => b[1] - a[1])
      .slice(0,2)
      .map(entry => entry[0]);

    // Get providers from those categories, excluding already booked
    const bookedProviderIds = bookings.map(b => b.provider._id.toString());
    const recommendedProviders = await User.find({
      role: 'provider',
      'providerProfile.isVerified': true,
      'providerProfile.category': { $in: topCategories },
      _id: { $nin: bookedProviderIds }
    }).limit(5);

    res.json({ success: true, data: recommendedProviders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRecommendations };