const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Firebase (with error handling)
try {
  const { initializeFirebase } = require('./config/firebase');
  initializeFirebase();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.log('⚠️  Firebase initialization skipped:', error.message);
  console.log('💡 Server will run without Firebase. Set up Firebase credentials in .env to enable database features.');
}

// Check JWT configuration
if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
  console.log('✅ JWT authentication configured successfully');
  if (!process.env.JWT_ACCESS_TOKEN_EXPIRY) {
    process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
    console.log('🔧 JWT_ACCESS_TOKEN_EXPIRY not set, using default: 15m');
  }
  if (!process.env.JWT_REFRESH_TOKEN_EXPIRY) {
    process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
    console.log('🔧 JWT_REFRESH_TOKEN_EXPIRY not set, using default: 7d');
  }
} else if (process.env.JWT_SECRET) {
  console.log('⚠️  JWT partially configured - JWT_REFRESH_SECRET missing');
  console.log('💡 Add JWT_REFRESH_SECRET to .env for full JWT functionality');
} else {
  console.log('⚠️  JWT authentication not configured');
  console.log('💡 Add JWT_SECRET and JWT_REFRESH_SECRET to .env to enable JWT authentication');
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce Warehouse API',
    version: '1.0.0',
    status: 'active',
    firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not configured',
    jwt: process.env.JWT_SECRET ? 'configured' : 'not configured',
    authentication: {
      firebase: process.env.FIREBASE_PROJECT_ID ? 'available' : 'not available',
      jwt: process.env.JWT_SECRET ? 'available' : 'not available'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
try {
  // Firebase-based auth routes
  app.use('/api/auth', require('./routes/auth'));
  
  // JWT-based auth routes (requires JWT_SECRET in .env)
  if (process.env.JWT_SECRET) {
    app.use('/api/jwt-auth', require('./routes/jwtAuth'));
    console.log('✅ JWT authentication routes enabled');
  } else {
    console.log('⚠️  JWT authentication disabled - set JWT_SECRET in .env to enable');
  }
  
  // Other API routes
  app.use('/api/products', require('./routes/products'));
  app.use('/api/inventory', require('./routes/inventory'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/users', require('./routes/users'));
  
} catch (error) {
  console.log('⚠️  Some routes may not work without proper configuration:', error.message);
}

// 404 handler (must be before error handler)
app.use(notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});
