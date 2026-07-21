const jwt = require('jsonwebtoken');
const config = require('../config/default');

function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No admin authorization token provided',
      });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.ADMIN_JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin token has expired',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid admin authorization token',
    });
  }
}

module.exports = adminAuth;
