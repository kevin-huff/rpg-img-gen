const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db/database');
const { initializeAuth, requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const sceneRoutes = require('./routes/scenes');
const characterRoutes = require('./routes/characters');
const templateRoutes = require('./routes/templates');
const imageRoutes = require('./routes/images');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Dynamic CORS for Railway
const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  'https://*.railway.app',
  /.*\.railway\.app$/
];

if (process.env.RAILWAY_STATIC_URL) {
  allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Enable cookies for sessions
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/overlay', express.static(path.join(__dirname, 'obs-overlay')));

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
}

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scenes', requireAuth, sceneRoutes);
app.use('/api/characters', requireAuth, characterRoutes);
app.use('/api/templates', requireAuth, templateRoutes);
app.use('/api/images', requireAuth, imageRoutes);

// Health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check (legacy endpoint)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('join-overlay', () => {
    socket.join('overlay');
    console.log('Client joined overlay room:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  // In production, serve the React app for non-API routes
  if (process.env.NODE_ENV === 'production' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await initializeAuth();
    console.log('Database and authentication initialized successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 API available at http://localhost:${PORT}/api`);
      console.log(`🎥 OBS Overlay at http://localhost:${PORT}/overlay`);
      console.log(`📁 Uploads served at http://localhost:${PORT}/uploads`);
      console.log(`🔐 Authentication enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
