const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Production-ready session store
let SessionStore;
if (process.env.NODE_ENV === 'production') {
  const SQLiteStore = require('connect-sqlite3')(session);
  SessionStore = SQLiteStore;
} else {
  SessionStore = session.MemoryStore;
}

const { initializeDatabase } = require('./db/database');
const { initializeAuth, requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const sceneRoutes = require('./routes/scenes');
const characterRoutes = require('./routes/characters');
const templateRoutes = require('./routes/templates');
const imageRoutes = require('./routes/images');

const app = express();

// Trust proxy for Railway (fixes session cookies and rate limiting)
if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  app.set('trust proxy', 1);
  console.log('✅ Trust proxy enabled for Railway');
}

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
  process.env.CORS_ORIGIN || "http://localhost:5173"
];

// Add Railway domains
if (process.env.RAILWAY_STATIC_URL) {
  allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
}

// Add common Railway patterns
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(/https:\/\/.*\.railway\.app$/);
  allowedOrigins.push(/https:\/\/.*\.up\.railway\.app$/);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Enable cookies for sessions
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware with production-ready store
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'rpg.sid', // Custom session name
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // Allow cross-site requests
  }
};

// Use SQLite session store in production
if (process.env.NODE_ENV === 'production') {
  try {
    sessionConfig.store = new SessionStore({
      db: 'sessions.db',
      dir: process.env.RAILWAY_ENVIRONMENT ? '/app/data' : './db',
      table: 'sessions'
    });
    console.log('✅ SQLite session store initialized');
  } catch (error) {
    console.error('❌ Failed to initialize SQLite session store:', error);
    console.log('📝 Falling back to memory store (not recommended for production)');
  }
}

app.use(session(sessionConfig));

// Remove debugging middleware after fixing the issue
// Debug middleware for session tracking (only in production for now)
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     console.log(`📊 ${req.method} ${req.path} - Session ID: ${req.sessionID} - User: ${req.session?.user?.username || 'None'}`);
//     next();
//   });
// }

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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    if (process.env.NODE_ENV === 'production') {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await initializeAuth();
    console.log('Database and authentication initialized successfully');
    
    const serverInstance = server.listen(PORT, '0.0.0.0', () => {
      const actualPort = serverInstance.address().port;
      console.log(`🚀 Server running on port ${actualPort}`);
      
      // Railway-aware URLs
      if (process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_ENVIRONMENT) {
        console.log(`🌐 App URL: ${process.env.RAILWAY_STATIC_URL || 'https://your-app.railway.app'}`);
        console.log(`🎥 OBS Overlay: ${process.env.RAILWAY_STATIC_URL || 'https://your-app.railway.app'}/overlay`);
      } else {
        console.log(`📱 API available at http://localhost:${actualPort}/api`);
        console.log(`🎥 OBS Overlay at http://localhost:${actualPort}/overlay`);
        console.log(`📁 Uploads served at http://localhost:${actualPort}/uploads`);
      }
      
      console.log(`🔐 Authentication enabled`);
      console.log(`💾 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
