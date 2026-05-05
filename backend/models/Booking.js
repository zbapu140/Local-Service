const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined'], default: 'pending' },
    totalAmount: { type: Number, required: true },
    originalAmount: { type: Number, default: null },
    promotionApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', default: null },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, default: 'cash' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);