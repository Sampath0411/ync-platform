const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, snapshotToArray } = require('../db/firebase');
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

router.post('/subscribe', auth, [
  body('endpoint').notEmpty().withMessage('Endpoint is required'),
  body('keys').isObject().withMessage('Keys must be an object'),
], handleErrors, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const db = getFirestore();

    // Remove old subscription with same endpoint
    const existingSnap = await db.collection('push_subscriptions')
      .where('endpoint', '==', endpoint)
      .get();

    const batch = db.batch();
    existingSnap.forEach(doc => batch.delete(doc.ref));

    const id = uuidv4();
    batch.set(db.collection('push_subscriptions').doc(id), {
      id,
      user_id: req.user.id,
      endpoint,
      keys,
      is_active: 1,
      created_at: new Date().toISOString(),
    });

    await batch.commit();

    res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const db = getFirestore();

    if (endpoint) {
      const snap = await db.collection('push_subscriptions')
        .where('endpoint', '==', endpoint)
        .get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } else {
      const snap = await db.collection('push_subscriptions')
        .where('user_id', '==', req.user.id)
        .get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/send', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
], handleErrors, async (req, res) => {
  try {
    const { title, message } = req.body;
    const db = getFirestore();

    const snap = await db.collection('push_subscriptions')
      .where('is_active', '==', 1)
      .get();

    const subscriptions = snapshotToArray(snap);

    if (subscriptions.length === 0) {
      return res.json({ success: true, message: 'No subscribers to notify', sent: 0 });
    }

    let sent = 0;
    try {
      const webPush = require('web-push');
      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      if (vapidPublicKey && vapidPrivateKey) {
        webPush.setVapidDetails('mailto:sampathlox@gmail.com', vapidPublicKey, vapidPrivateKey);
        const payload = JSON.stringify({ title, message, timestamp: new Date().toISOString() });

        for (const sub of subscriptions) {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys || {} },
              payload
            );
            sent++;
          } catch (pushErr) {
            if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
              await db.collection('push_subscriptions')
                .where('endpoint', '==', sub.endpoint)
                .get().then(s => s.forEach(doc => doc.ref.delete()));
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
