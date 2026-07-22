process.env.SERVERLESS = '1';
process.env.VERCEL = '1';

module.exports = function handler(req, res) {
  try {
    const app = require('../server/index');
    app(req, res);
  } catch (err) {
    console.error('Failed to load server:', err.message);
    console.error(err.stack);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
};
