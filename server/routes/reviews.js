const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
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

router.get('/event/:eventId', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('reviews')
      .where('event_id', '==', req.params.eventId)
      .where('is_published', '==', 1)
      .orderBy('created_at', 'desc')
      .get();

    const reviews = [];
    const s = { count: 0, average: 0, five: 0, four: 0, three: 0, two: 0, one: 0 };

    for (const doc of snap.docs) {
      const r = { id: doc.id, ...doc.data() };
      const user = r.user_id ? await getDoc('users', r.user_id) : null;
      reviews.push({
        id: r.id, rating: r.rating, review: r.review, created_at: r.created_at,
        user_name: user?.name || null, profile_photo: user?.profile_photo || null,
      });
      s.count++;
      s.average += r.rating || 0;
      if (r.rating === 5) s.five++;
      else if (r.rating === 4) s.four++;
      else if (r.rating === 3) s.three++;
      else if (r.rating === 2) s.two++;
      else if (r.rating === 1) s.one++;
    }

    if (s.count > 0) s.average = s.average / s.count;

    res.json({ success: true, data: { reviews, stats: s } });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', auth, [
  body('event_id').notEmpty().withMessage('Event ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 2000 }).withMessage('Review must be under 2000 characters'),
], handleErrors, async (req, res) => {
  try {
    const { event_id, rating, review } = req.body;
    const db = getFirestore();

    const event = await getDoc('events', event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const bookingSnap = await db.collection('bookings')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', event_id)
      .where('status', '==', 'confirmed')
      .limit(1)
      .get();

    if (bookingSnap.empty) {
      return res.status(403).json({ success: false, message: 'You must have a confirmed booking to review this event' });
    }

    const booking = { id: bookingSnap.docs[0].id, ...bookingSnap.docs[0].data() };

    // Check for duplicate review
    const existingSnap = await db.collection('reviews')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', event_id)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Update existing review
      const existingId = existingSnap.docs[0].id;
      await db.collection('reviews').doc(existingId).update({
        rating, review: review || null,
        updated_at: new Date().toISOString(),
      });
      const updated = await getDoc('reviews', existingId);
      return res.json({ success: true, data: updated, message: 'Review updated' });
    }

    const id = uuidv4();
    await db.collection('reviews').doc(id).set({
      id, user_id: req.user.id, event_id, booking_id: booking.id,
      rating, review: review || null, is_published: 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    const newReview = await getDoc('reviews', id);
    res.status(201).json({ success: true, data: newReview, message: 'Review submitted' });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('reviews')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();

    const reviews = [];
    for (const doc of snap.docs) {
      const r = { id: doc.id, ...doc.data() };
      const event = r.event_id ? await getDoc('events', r.event_id) : null;
      reviews.push({ ...r, event_name: event?.name || null, cover_image: event?.cover_image || null });
    }

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Get my reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const review = await getDoc('reviews', req.params.id);
    if (!review || review.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    await db.collection('reviews').doc(req.params.id).delete();
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const review = await getDoc('reviews', req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    await db.collection('reviews').doc(req.params.id).update({
      is_published: review.is_published ? 0 : 1,
    });
    res.json({ success: true, message: 'Review toggled' });
  } catch (err) {
    console.error('Toggle review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/all', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('reviews').orderBy('created_at', 'desc').get();

    const reviews = [];
    for (const doc of snap.docs) {
      const r = { id: doc.id, ...doc.data() };
      const [event, user] = await Promise.all([
        getDoc('events', r.event_id),
        getDoc('users', r.user_id),
      ]);
      reviews.push({ ...r, event_name: event?.name || null, user_name: user?.name || null });
    }

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('List all reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
