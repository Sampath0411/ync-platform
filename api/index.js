process.env.SERVERLESS = '1';
process.env.VERCEL = '1';

const serverless = require('serverless-http');

let handler = null;

async function getApp() {
  if (handler) return handler;

  const app = require('../server/index');
  handler = serverless(app, { binary: false });
  return handler;
}

module.exports = async function vercelHandler(req, res) {
  try {
    const h = await getApp();
    return h(req, res);
  } catch (err) {
    console.error('Serverless init error:', err.message);
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
