const Promotion = require('../models/Promotion');

//Create a new promotion
const createPromotion = async (req, res) => {
  try {
    const { title, description, discountPercentage, validUntil, isActive } = req.body;
    
    console.log("Creating promotion for provider:", req.user._id);
    console.log("Provider role:", req.user.role);
    console.log("Promotion data:", { title, description, discountPercentage, validUntil });

    // Check if user is a provider
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can create promotions'
      });
    }

    // Validate input
    if (!title || !description || !discountPercentage || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (discountPercentage < 1 || discountPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percentage must be between 1 and 100'
      });
    }

    // Create promotion
    const promotion = await Promotion.create({
      provider: req.user._id,
      title,
      description,
      discountPercentage,
      validUntil: new Date(validUntil),
      isActive: isActive !== undefined ? isActive : true,
    });

    console.log("Promotion created:", promotion);

    res.status(201).json({
      success: true,
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Get all promotions for a provider
const getProviderPromotions = async (req, res) => {
  try {
    // Ensure provider can only see their own promotions
    if (req.user._id.toString() !== req.params.providerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these promotions'
      });
    }

    const promotions = await Promotion.find({ provider: req.params.providerId })
      .sort('-createdAt');

    res.json({
      success: true,
      data: promotions,
      count: promotions.length
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Get single promotion
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if provider owns this promotion
    if (promotion.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this promotion'
      });
    }

    res.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Update promotion
const updatePromotion = async (req, res) => {
  try {
    const { title, description, discountPercentage, validUntil, isActive } = req.body;

    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if provider owns this promotion
    if (promotion.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this promotion'
      });
    }

    // Update fields
    if (title) promotion.title = title;
    if (description) promotion.description = description;
    if (discountPercentage) {
      if (discountPercentage < 1 || discountPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 1 and 100'
        });
      }
      promotion.discountPercentage = discountPercentage;
    }
    if (validUntil) promotion.validUntil = new Date(validUntil);
    if (isActive !== undefined) promotion.isActive = isActive;

    await promotion.save();

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Toggle promotion active status
const togglePromotionStatus = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if provider owns this promotion
    if (promotion.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this promotion'
      });
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    res.json({
      success: true,
      data: promotion,
      message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle promotion status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Delete promotion
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if provider owns this promotion
    if (promotion.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this promotion'
      });
    }

    await promotion.deleteOne();

    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//Increment promotion usage count (when a customer uses it)
const incrementPromotionUsage = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Check if promotion is still valid
    if (promotion.validUntil < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Promotion has expired'
      });
    }

    if (!promotion.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Promotion is not active'
      });
    }

    promotion.usageCount += 1;
    await promotion.save();

    res.json({
      success: true,
      data: promotion,
      message: 'Promotion usage recorded'
    });
  } catch (error) {
    console.error('Increment promotion usage error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPromotion,
  getProviderPromotions,
  getPromotionById,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  incrementPromotionUsage,
};