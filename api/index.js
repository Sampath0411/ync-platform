process.env.SERVERLESS = '1';

let app;

try {
  app = require('../server/index');
} catch (err) {
  console.error('CRITICAL: Failed to load Express app:', err.message);
  console.error(err.stack);

  // Return a minimal error handler so Vercel doesn't 503
  const express = require('express');
  app = express();
  app.get('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
    });
  });
}

module.exports = app;
