const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/sendEmail'); 
const jwt = require('jsonwebtoken');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    console.log(`\n📧 OTP Request for: ${email}`);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered. Please login instead.' 
      });
    }

    await OTP.deleteMany({ email });

    const otp = generateOTP();
    console.log(`🔑 Generated OTP: ${otp}`);

    await OTP.create({ 
      email, 
      otp,
      createdAt: new Date()
    });

    const emailSent = await sendOTPEmail(email, otp);

    if (emailSent) {
      res.status(200).json({ 
        success: true,
        message: 'OTP sent successfully to your email',
        debug: process.env.NODE_ENV === 'development' ? { otp } : undefined
      });
    } else {
      res.status(200).json({ 
        success: true,
        message: 'OTP generated. Check console for OTP (email sending failed)',
        debug: { otp }
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.' 
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    console.log(`\n🔐 Verifying OTP for: ${email}`);
    console.log(`📝 Entered OTP: ${otp}`);

    const record = await OTP.findOne({ email, otp });
    
    if (!record) {
      console.log(`❌ Invalid or expired OTP for ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }

    const createdAt = new Date(record.createdAt);
    const now = new Date();
    const diffMinutes = (now - createdAt) / 1000 / 60;
    
    if (diffMinutes > 5) {
      await record.deleteOne();
      console.log(`❌ OTP expired for ${email}`);
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    await record.deleteOne();

    const emailVerificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    console.log(`✅ OTP verified successfully for ${email}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      emailVerificationToken,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Verification failed. Please try again.' 
    });
  }
};

const debugGetOTP = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    
    const record = await OTP.findOne({ email }).sort('-createdAt');
    if (!record) {
      return res.status(404).json({ message: 'No OTP found for this email' });
    }
    
    res.json({
      email: record.email,
      otp: record.otp,
      createdAt: record.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendOTP, verifyOTP, debugGetOTP };