process.env.SERVERLESS = '1';

const serverless = require('serverless-http');

let app;

try {
  app = require('../server/index');
} catch (err) {
  console.error('CRITICAL: Failed to load Express app:', err.message);
  console.error(err.stack);

  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
    });
  });
}

module.exports = (req, res) => serverless(app)(req, res);
