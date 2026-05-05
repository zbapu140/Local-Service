const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const generateToken = require('../utils/generateToken');
const sendResetEmail = require('../utils/sendResetEmail');
const crypto = require('crypto');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, providerProfile, emailVerificationToken } = req.body;
    if (!emailVerificationToken) return res.status(400).json({ message: 'Email verification required' });
    let decoded;
    try {
      decoded = jwt.verify(emailVerificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    if (decoded.email !== email) return res.status(400).json({ message: 'Email mismatch' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    if (role === 'provider' && providerProfile?.category) {
      const categoryExists = await Category.findById(providerProfile.category);
      if (!categoryExists) return res.status(400).json({ message: 'Invalid category selected' });
    }

    const userData = { name, email, password, role: role || 'user', phone: phone || '' };
    if (role === 'provider') {
      userData.providerProfile = {
        category: providerProfile?.category || null,
        experience: providerProfile?.experience || 0,
        location: providerProfile?.location || '',
        description: providerProfile?.description || '',
        pricePerService: providerProfile?.pricePerService || 0,
        isVerified: false, // FIXED: default false
        isBlocked: false,
      };
    }

    const user = await User.create(userData);
    if (user) {
      res.status(201).json({
        message: `${role === 'provider' ? 'Provider' : 'User'} account created successfully`,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          ...(role === 'provider' && { providerProfile: user.providerProfile })
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await user.matchPassword(password);
    if (isMatch) {
      if (user.role === 'provider' && user.providerProfile?.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
      }
      const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          createdAt: user.createdAt,
        }
      };
      if (user.role === 'provider') response.user.providerProfile = user.providerProfile;
      res.json(response);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('providerProfile.category', 'name');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      if (req.body.password) user.password = req.body.password;
      if (user.role === 'provider' && req.body.providerProfile) {
        user.providerProfile = { ...user.providerProfile, ...req.body.providerProfile };
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        providerProfile: updatedUser.providerProfile,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendResetEmail(user.email, resetUrl);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, forgotPassword, resetPassword };