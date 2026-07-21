const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }
  next();
}

// POST /api/push/subscribe — save push subscription
router.post('/subscribe', auth, [
  body('endpoint').notEmpty().withMessage('Endpoint is required'),
  body('keys').isObject().withMessage('Keys must be an object'),
], handleErrors, (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const db = getDb();

    // Remove old subscription with same endpoint
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);

    const id = uuidv4();
    db.prepare(
      'INSERT INTO push_subscriptions (id, user_id, endpoint, keys) VALUES (?, ?, ?, ?)'
    ).run(id, req.user.id, endpoint, JSON.stringify(keys));

    res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/push/unsubscribe — remove push subscription
router.delete('/unsubscribe', auth, (req, res) => {
  try {
    const { endpoint } = req.body;
    const db = getDb();

    if (endpoint) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
    } else {
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(req.user.id);
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: send push notification to all subscribers
router.post('/send', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
], handleErrors, async (req, res) => {
  try {
    const { title, message } = req.body;
    const db = getDb();

    const subscriptions = db.prepare(
      'SELECT endpoint, keys FROM push_subscriptions WHERE is_active = 1'
    ).all();

    if (subscriptions.length === 0) {
      return res.json({ success: true, message: 'No subscribers to notify', sent: 0 });
    }

    // Try web-push if available
    let sent = 0;
    try {
      const webPush = require('web-push');

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      if (vapidPublicKey && vapidPrivateKey) {
        webPush.setVapidDetails(
          'mailto:sampathlox@gmail.com',
          vapidPublicKey,
          vapidPrivateKey
        );

        const payload = JSON.stringify({ title, message, timestamp: new Date().toISOString() });

        for (const sub of subscriptions) {
          try {
            let keys;
            try { keys = JSON.parse(sub.keys); } catch (e) { keys = {}; }
            await webPush.sendNotification({ endpoint: sub.endpoint, keys }, payload);
            sent++;
          } catch (pushErr) {
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              // Subscription expired — remove it
              db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
            }
          }
        }
      } else {
        console.log('VAPID keys not configured — push notification skipped');
      }
    } catch (pushErr) {
      console.error('Push send error:', pushErr.message);
    }

    res.json({ success: true, message: 'Push notification sent', sent });
  } catch (err) {
    console.error('Push send admin error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
