const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const auth = require('../middleware/auth');

const router = express.Router();

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }
  next();
}

function generateCode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.post('/', auth, [
  body('target_url').isURL().withMessage('Valid target URL is required'),
  body('type').optional().isIn(['ticket', 'event', 'other']).withMessage('Invalid type'),
  body('reference_id').optional().isString(),
], handleErrors, async (req, res) => {
  try {
    const { target_url, type = 'other', reference_id } = req.body;
    const db = getFirestore();

    let code;
    let attempts = 0;
    do {
      code = generateCode(8);
      attempts++;
      const existing = await getDoc('short_urls', code);
      if (!existing) break;
    } while (attempts < 5);

    if (attempts >= 5) {
      return res.status(500).json({ success: false, message: 'Failed to generate unique code' });
    }

    await db.collection('short_urls').doc(code).set({
      code,
      target_url,
      type,
      reference_id: reference_id || null,
      click_count: 0,
      created_at: new Date().toISOString(),
    });

    const shortUrl = `${req.protocol}://${req.get('host')}/s/${code}`;
    res.status(201).json({ success: true, data: { code, short_url: shortUrl, target_url } });
  } catch (err) {
    console.error('Create short URL error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('short_urls').orderBy('created_at', 'desc').get();
    const urls = snapshotToArray(snap);
    res.json({ success: true, data: urls });
  } catch (err) {
    console.error('Get short URLs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
