const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Handle Railway proxy properly
  trustProxy: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT,
});

// Validation schema
const loginSchema = Joi.object({
  username: Joi.string().required().max(100),
  password: Joi.string().required().max(200)
});

// POST /api/auth/login - User login
router.post('/login', loginLimiter, async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const { username, password } = value;
  
  try {
    const user = await authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Set session
    req.session.user = user;
    
    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      
      res.json({ 
        message: 'Login successful',
        user: { username: user.username }
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: 'Logout successful' });
    });
  } else {
    res.json({ message: 'No active session' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// GET /api/auth/status - Check authentication status
router.get('/status', (req, res) => {
  res.json({ 
    authenticated: !!(req.session && req.session.user),
    user: req.session?.user || null
  });
});

module.exports = router;
