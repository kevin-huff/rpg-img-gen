const bcrypt = require('bcryptjs');

// Simple in-memory user store for single user
const users = {
  [process.env.ADMIN_USERNAME || 'admin']: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: null // Will be set during initialization
  }
};

// Initialize admin user password
async function initializeAuth() {
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  users[process.env.ADMIN_USERNAME || 'admin'].password = hashedPassword;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Admin credentials: ${process.env.ADMIN_USERNAME || 'admin'} / ${plainPassword}`);
  }
}

// Authenticate user
async function authenticateUser(username, password) {
  const user = users[username];
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (isValid) {
    return { username: user.username };
  }
  
  return null;
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  console.log('Auth check - Session exists:', !!req.session);
  console.log('Auth check - User in session:', !!req.session?.user);
  console.log('Auth check - Session ID:', req.sessionID);
  
  if (req.session && req.session.user) {
    return next();
  }
  
  console.log('Auth failed - returning 401');
  return res.status(401).json({ error: 'Authentication required' });
}

// Middleware to check if user is authenticated (for HTML routes)
function requireAuthHTML(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Redirect to login page
  return res.redirect('/login');
}

module.exports = {
  initializeAuth,
  authenticateUser,
  requireAuth,
  requireAuthHTML
};
