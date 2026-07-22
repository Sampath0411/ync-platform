process.env.SERVERLESS = '1';
process.env.VERCEL = '1';

const serverless = require('serverless-http');

let handler = null;

module.exports = async function vercelHandler(req, res) {
  try {
    if (!handler) {
      const app = require('../server/index');
      handler = serverless(app);
    }
    return await handler(req, res);
  } catch (err) {
    console.error('CRITICAL:', err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Server error' }));
    }
  }
};
