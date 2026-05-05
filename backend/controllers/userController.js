const User = require('../models/User');

//Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get all providers
const getProviders = async (req, res) => {
  try {
    const providers = await User.find({ role: 'provider' })
      .select('-password')
      .populate('providerProfile.category', 'name');
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Verify provider
const verifyProvider = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'provider') {
      return res.status(400).json({ message: 'User is not a provider' });
    }

    user.providerProfile.isVerified = true;
    await user.save();

    res.json({ message: 'Provider verified successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Block/Unblock user
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block admin' });
    }

    if (user.role === 'provider') {
      user.providerProfile.isBlocked = !user.providerProfile.isBlocked;
      await user.save();
      res.json({ 
        message: `Provider ${user.providerProfile.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        isBlocked: user.providerProfile.isBlocked
      });
    } else {
      user.isBlocked = !user.isBlocked;
      await user.save();
      res.json({ 
        message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        isBlocked: user.isBlocked
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getProviders,
  verifyProvider,
  toggleBlockUser,
};