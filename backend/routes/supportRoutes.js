const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

// Create a ticket
router.post('/tickets', protect, async (req, res) => {
  try {
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject: req.body.subject,
      description: req.body.description,
      category: req.body.category,
    });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's tickets
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;