const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Allowlist of valid setting keys
const ALLOWED_SETTING_KEYS = [
  'site_name', 'tagline', 'description', 'contact_email', 'contact_phone',
  'address', 'timezone', 'maintenance_mode', 'allow_registration',
  'require_email_verification', 'max_events_per_day',
  'social_instagram', 'social_youtube', 'social_twitter', 'social_linkedin',
  'social_facebook', 'social_website', 'about_content',
];

const settingRules = [
  body('value').notEmpty().withMessage('Value is required'),
];

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join('. '),
    });
  }
  next();
}

// Admin: Get all settings
router.get('/', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings ORDER BY key ASC').all();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Update/upsert a specific setting
router.put('/:key', adminAuth, settingRules, handleErrors, (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Validate key is in allowlist
    if (!ALLOWED_SETTING_KEYS.includes(key)) {
      return res.status(400).json({
        success: false,
        message: `Invalid setting key: ${key}`,
      });
    }

    const db = getDb();
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Upsert: insert or replace
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, stringValue);

    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
