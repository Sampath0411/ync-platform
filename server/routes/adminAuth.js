const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/init');
const config = require('../config/default');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      config.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...adminData } = admin;

    res.json({
      success: true,
      data: {
        admin: adminData,
        token,
      },
      message: 'Admin login successful',
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/me', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { password_hash, ...adminData } = admin;
    res.json({ success: true, data: adminData });
  } catch (err) {
    console.error('Get admin profile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
