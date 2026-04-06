const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('node_id');
    if (user && (await user.comparePassword(password))) {
      const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        node_id: user.node_id,
        organization: user.organization, // Added organization
        token: token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get User Profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
