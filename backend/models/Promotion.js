const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Promotion title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Promotion description is required'],
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
promotionSchema.index({ provider: 1, isActive: 1 });
promotionSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);