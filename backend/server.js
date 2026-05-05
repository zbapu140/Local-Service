const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

dotenv.config();
connectDB();

const app = express();

// Rate limiting for OTP
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: 'Please wait before requesting another OTP'
});

// CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.indexOf(origin) !== -1) callback(null, true);
  else callback(new Error('CORS not allowed'));
}, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/category', require('./routes/categoryRoutes'));
app.use('/api/booking', require('./routes/bookingRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/providers', require('./routes/providerRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/withdrawals', require('./routes/withdrawalRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));


app.get('/', (req, res) => res.json({ message: 'API is running...' }));

// Debug routes only in development
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/users', async (req, res) => {
    const User = require('./models/User');
    const users = await User.find({}).select('-password');
    res.json({ totalUsers: users.length, users: users.map(u => ({ email: u.email, role: u.role, name: u.name })) });
  });
  app.get('/debug/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ message: 'No token provided' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, providerProfile: user.providerProfile });
  });
}

app.post('/temp-create-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
      return res.json({ message: 'Admin already exists', user: existing });
    }
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    res.json({ message: 'Admin created', admin: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));