const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const auth = require('../middleware/auth');

const router = express.Router();

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }
  next();
}

// Generate a random short code
function generateCode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/short-urls — create a short URL
router.post('/', auth, [
  body('target_url').isURL().withMessage('Valid target URL is required'),
  body('type').optional().isIn(['ticket', 'event', 'other']).withMessage('Invalid type'),
  body('reference_id').optional().isString(),
], handleErrors, (req, res) => {
  try {
    const { target_url, type = 'other', reference_id } = req.body;
    const db = getDb();

    // Generate unique code
    let code;
    let attempts = 0;
    do {
      code = generateCode(8);
      attempts++;
    } while (db.prepare('SELECT code FROM short_urls WHERE code = ?').get(code) && attempts < 5);

    if (attempts >= 5) {
      return res.status(500).json({ success: false, message: 'Failed to generate unique code' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO short_urls (code, target_url, type, reference_id) VALUES (?, ?, ?, ?)'
    ).run(code, target_url, type, reference_id || null);

    const shortUrl = `${req.protocol}://${req.get('host')}/s/${code}`;
    res.status(201).json({ success: true, data: { code, short_url: shortUrl, target_url } });
  } catch (err) {
    console.error('Create short URL error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/short-urls/my — list user's short URLs
router.get('/my', auth, (req, res) => {
  try {
    const db = getDb();
    const urls = db.prepare(
      'SELECT * FROM short_urls WHERE reference_id IN (SELECT id FROM tickets WHERE user_id = ?) OR reference_id IN (SELECT id FROM events) ORDER BY created_at DESC'
    ).all(req.user.id);
    res.json({ success: true, data: urls });
  } catch (err) {
    console.error('Get short URLs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
