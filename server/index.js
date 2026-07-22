const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { Server } = require('socket.io');
const { getFirestore, getDoc } = require('./db/firebase');
const config = require('./config/default');
const errorHandler = require('./middleware/errorHandler');
const { checkExpiredMemberships } = require('./services/membershipExpiry');

// Import routes
const authRoutes = require('./routes/auth');
const adminAuthRoutes = require('./routes/adminAuth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const ticketRoutes = require('./routes/tickets');
const membershipRoutes = require('./routes/memberships');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const galleryRoutes = require('./routes/gallery');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/users');
const faqRoutes = require('./routes/faqs');
const sponsorRoutes = require('./routes/sponsors');
const testimonialRoutes = require('./routes/testimonials');
const settingsRoutes = require('./routes/settings');
const favoriteRoutes = require('./routes/favorites');
const waitlistRoutes = require('./routes/waitlist');
const reviewRoutes = require('./routes/reviews');
const feedbackRoutes = require('./routes/feedback');
const shortUrlRoutes = require('./routes/shortUrls');
const pushRoutes = require('./routes/push');
const analyticsRoutes = require('./routes/analytics');
const cronRoutes = require('./routes/cron');

const isServerless = process.env.VERCEL === '1' || process.env.SERVERLESS === '1';

console.log('Initializing Firebase...');
getFirestore();

// Validate required environment variables at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'ync_jwt_secret_key_2026') {
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable for production.');
}
if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET === 'ync_admin_jwt_secret_key_2026') {
  console.warn('WARNING: Using default ADMIN_JWT_SECRET. Set ADMIN_JWT_SECRET environment variable for production.');
}

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — skip in serverless to avoid noisy memory-store warnings per function instance
if (!isServerless) {
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', generalLimiter);

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/admin/auth/login', authLimiter);

  const contactLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many messages. Please try again later.' },
  });
  app.use('/api/contact', contactLimiter);
}

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Static file serving for legacy local uploads only. New uploads use Firebase Storage.
if (!isServerless) {
  app.use('/uploads', express.static(config.UPLOAD_DIR));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/short-urls', shortUrlRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/cron', cronRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'YNC API is running', timestamp: new Date().toISOString() });
});

// Short URL redirect — using Firestore
app.get('/s/:code', async (req, res) => {
  try {
    const url = await getDoc('short_urls', req.params.code);
    if (!url) {
      return res.status(404).send('Link not found');
    }

    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).send('This link has expired');
    }

    // Increment click count
    const db = getFirestore();
    await db.collection('short_urls').doc(req.params.code).update({
      click_count: (url.click_count || 0) + 1,
    });

    res.redirect(301, url.target_url);
  } catch (err) {
    console.error('Short URL redirect error:', err);
    res.status(500).send('Redirect error');
  }
});

// --- Production static file serving for traditional Node hosts only ---
if (process.env.NODE_ENV === 'production' && !isServerless) {
  const clientDist = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    console.log(`[production] Serving static files from ${clientDist}`);
    app.use(express.static(clientDist));

    app.get(/^(?!\/api\/|\/uploads\/|\/s\/).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    console.warn('[production] client/dist not found — run "cd client && npm run build" first');
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Error handler
app.use(errorHandler);

function startSocketServer(server) {
  if (process.env.ENABLE_SOCKET === 'false') return null;

  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, config.ADMIN_JWT_SECRET);
        socket.userId = decoded.id;
        socket.user = decoded;
        socket.isAdmin = true;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);

    socket.join(`user:${socket.userId}`);

    if (socket.isAdmin) {
      socket.join('admin');
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userId}`);
    });
  });

  app.set('io', io);
  return io;
}

function startServer() {
  // Check for expired memberships on startup and every hour for long-running Node hosts only.
  checkExpiredMemberships();
  setInterval(checkExpiredMemberships, 60 * 60 * 1000);

  const server = http.createServer(app);
  startSocketServer(server);

  server.listen(config.PORT, () => {
    console.log(`YNC Server running on port ${config.PORT}`);
    console.log(`API available at http://localhost:${config.PORT}/api`);
    console.log(`Uploads directory: ${config.UPLOAD_DIR}`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
