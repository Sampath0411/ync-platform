process.env.SERVERLESS = '1';
process.env.VERCEL = '1';

module.exports = function handler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, url: req.url, timestamp: new Date().toISOString() }));
};
