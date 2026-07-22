const express = require('express');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

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

router.get('/', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await getDoc('settings', 'app_settings');
    if (!doc) {
      return res.json({ success: true, data: [] });
    }

    // Convert settings document to key-value array format
    const settings = Object.entries(doc)
      .filter(([key]) => key !== 'id' && key !== 'created_at' && key !== 'updated_at')
      .map(([key, value]) => ({ key, value: String(value) }));

    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:key', adminAuth, settingRules, handleErrors, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!ALLOWED_SETTING_KEYS.includes(key)) {
      return res.status(400).json({ success: false, message: `Invalid setting key: ${key}` });
    }

    const db = getFirestore();
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

    await db.collection('settings').doc('app_settings').set({
      [key]: stringValue,
      updated_at: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true, data: { key, value: stringValue }, message: 'Setting updated successfully' });
  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
