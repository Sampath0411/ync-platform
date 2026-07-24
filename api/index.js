process.env.SERVERLESS = '1';
process.env.VERCEL = '1';

// Lazy-load the Express app so cold starts are fast.
// The heavy modules (Firebase Admin SDK, etc.) are only loaded on the first request.
let handler = null;

module.exports = async function vercelHandler(req, res) {
  try {
    if (!handler) {
      const serverless = require('serverless-http');
      const app = require('../server/index');
      handler = serverless(app);
    }
    return await handler(req, res);
  } catch (err) {
    console.error('CRITICAL:', err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: err.message || 'Internal server error',
        hint: 'Check Vercel environment variables — FIREBASE_SERVICE_ACCOUNT is required',
      }));
    }
  }
};
