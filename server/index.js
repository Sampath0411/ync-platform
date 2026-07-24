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

// Lazy route loader — modules are require()d on first request, not at startup.
// This keeps Vercel cold starts well under the 10s Hobby-plan timeout.
function lazyRouter(modulePath) {
  let router = null;
  return (req, res, next) => {
    if (!router) {
      router = require(modulePath);
    }
    router(req, res, next);
  };
}

const isServerless = process.env.VERCEL === '1' || process.env.SERVERLESS === '1';

// Initialize Firebase — failure is non-fatal; routes will surface the error individually
try {
  console.log('Initializing Firebase...');
  getFirestore();
} catch (err) {
  console.error('Firebase initialization FAILED:', err.message);
  console.error('The server will start, but any route that needs Firebase will return an error.');
}

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

// API Routes — all lazy-loaded to keep Vercel cold starts under 10s
app.use('/api/auth', lazyRouter('./routes/auth'));
app.use('/api/admin/auth', lazyRouter('./routes/adminAuth'));
app.use('/api/events', lazyRouter('./routes/events'));
app.use('/api/bookings', lazyRouter('./routes/bookings'));
app.use('/api/tickets', lazyRouter('./routes/tickets'));
app.use('/api/memberships', lazyRouter('./routes/memberships'));
app.use('/api/notifications', lazyRouter('./routes/notifications'));
app.use('/api/announcements', lazyRouter('./routes/announcements'));
app.use('/api/gallery', lazyRouter('./routes/gallery'));
app.use('/api/contact', lazyRouter('./routes/contact'));
app.use('/api/users', lazyRouter('./routes/users'));
app.use('/api/admin', lazyRouter('./routes/admin'));
app.use('/api/faqs', lazyRouter('./routes/faqs'));
app.use('/api/sponsors', lazyRouter('./routes/sponsors'));
app.use('/api/testimonials', lazyRouter('./routes/testimonials'));
app.use('/api/settings', lazyRouter('./routes/settings'));
app.use('/api/favorites', lazyRouter('./routes/favorites'));
app.use('/api/waitlist', lazyRouter('./routes/waitlist'));
app.use('/api/reviews', lazyRouter('./routes/reviews'));
app.use('/api/feedback', lazyRouter('./routes/feedback'));
app.use('/api/short-urls', lazyRouter('./routes/shortUrls'));
app.use('/api/push', lazyRouter('./routes/push'));
app.use('/api/admin/analytics', lazyRouter('./routes/analytics'));
app.use('/api/cron', lazyRouter('./routes/cron'));

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
