const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'provider', 'admin'], default: 'user' },
    providerProfile: {
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      experience: { type: Number, default: 0 },
      certifications: [String],
      workingHours: { start: { type: String, default: '09:00' }, end: { type: String, default: '18:00' } },
      isVerified: { type: Boolean, default: false }, // FIXED: default false
      isBlocked: { type: Boolean, default: false },
      location: { type: String, default: '' },
      description: { type: String, default: '' },
      pricePerService: { type: Number, default: 0 },
    },
    paymentDetails: {
      upi: { upiId: String, upiName: String, isDefault: Boolean },
      bank: { accountNumber: String, ifscCode: String, bankName: String, accountHolderName: String, isDefault: Boolean },
      wallet: { walletType: { type: String, enum: ['paytm', 'phonepe', 'googlepay', 'amazonpay'] }, walletId: String, mobileNumber: String, isDefault: Boolean },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);