import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import slowDown from 'express-slow-down';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import database connections
import { connectDB, connectRedis } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import foodRoutes from './routes/food';
import orderRoutes from './routes/orders';
import vendorRoutes from './routes/vendors';
import dietitianRoutes from './routes/dietitians';
import paymentRoutes from './routes/payments';
import aiRoutes from './routes/ai';
import challengeRoutes from './routes/challenges';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup for real-time features
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://healthybites.com.np',
      'https://www.healthybites.com.np',
      'https://admin.healthybites.com.np'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting for endpoints that should be slower
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 2
});

app.use('/api/auth/login', speedLimiter);
app.use('/api/auth/register', speedLimiter);

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HealthyBites API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dietitians', dietitianRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/challenges', challengeRoutes);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  // Join delivery person to their room
  socket.on('join-delivery-room', (deliveryPersonId) => {
    socket.join(`delivery-${deliveryPersonId}`);
  });
  
  // Join vendor to their room
  socket.on('join-vendor-room', (vendorId) => {
    socket.join(`vendor-${vendorId}`);
  });
  
  // Join order tracking room
  socket.on('track-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });
  
  // Handle consultation rooms
  socket.on('join-consultation', (consultationId) => {
    socket.join(`consultation-${consultationId}`);
  });
  
  // Handle dietitian consultation messages
  socket.on('consultation-message', (data) => {
    socket.to(`consultation-${data.consultationId}`).emit('new-message', data);
  });
  
  // Handle order status updates
  socket.on('order-status-update', (data) => {
    io.to(`order-${data.orderId}`).emit('status-update', data);
    io.to(`user-${data.userId}`).emit('order-notification', data);
  });
  
  // Handle delivery location updates
  socket.on('delivery-location-update', (data) => {
    io.to(`order-${data.orderId}`).emit('location-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Store socket.io instance for use in other modules
app.set('socketio', io);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();
    
    server.listen(PORT, () => {
      console.log(`🚀 HealthyBites API Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;