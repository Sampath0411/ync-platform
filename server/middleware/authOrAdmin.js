/**
 * Combined auth middleware — accepts both regular user tokens and admin tokens.
 * For endpoints that should be accessible by the owner OR an admin.
 */
const jwt = require('jsonwebtoken');
const config = require('../config/default');

function authOrAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = header.split(' ')[1];

    // Try user token first
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      // Not a user token, try admin
    }

    // Try admin token
    try {
      const decoded = jwt.verify(token, config.ADMIN_JWT_SECRET);
      req.admin = decoded;
      return next();
    } catch {
      // Neither worked
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
    });
  }
}

module.exports = authOrAdmin;
