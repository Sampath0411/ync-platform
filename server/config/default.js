const path = require('path');

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'ync_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'ync_admin_jwt_secret_key_2026',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
};
