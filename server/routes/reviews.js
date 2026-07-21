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

// GET /api/reviews/event/:eventId — public reviews for an event
router.get('/event/:eventId', (req, res) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.review, r.created_at, u.name as user_name, u.profile_photo
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ? AND r.is_published = 1
      ORDER BY r.created_at DESC
    `).all(req.params.eventId);

    const stats = db.prepare(`
      SELECT COUNT(*) as count, AVG(rating) as average, SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five,
             SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four, SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three,
             SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two, SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one
      FROM reviews WHERE event_id = ? AND is_published = 1
    `).get(req.params.eventId);

    res.json({ success: true, data: { reviews, stats: stats || { count: 0, average: 0 } } });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/reviews — create a review (must have booking for this event)
router.post('/', auth, [
  body('event_id').notEmpty().withMessage('Event ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 2000 }).withMessage('Review must be under 2000 characters'),
], handleErrors, (req, res) => {
  try {
    const { event_id, rating, review } = req.body;
    const db = getDb();

    const event = db.prepare('SELECT id, status FROM events WHERE id = ?').get(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // User must have a confirmed booking for this event (past or ongoing)
    const booking = db.prepare(
      "SELECT id FROM bookings WHERE user_id = ? AND event_id = ? AND status = 'confirmed'"
    ).get(req.user.id, event_id);
    if (!booking) {
      return res.status(403).json({ success: false, message: 'You must have a confirmed booking to review this event' });
    }

    // Check for duplicate review
    const existingReview = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND event_id = ?').get(req.user.id, event_id);
    if (existingReview) {
      // Update existing review instead
      db.prepare('UPDATE reviews SET rating = ?, review = ?, updated_at = datetime("now") WHERE id = ?')
        .run(rating, review || null, existingReview.id);
      const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(existingReview.id);
      return res.json({ success: true, data: updated, message: 'Review updated' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO reviews (id, user_id, event_id, booking_id, rating, review) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, event_id, booking.id, rating, review || null);

    const newReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: newReview, message: 'Review submitted' });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/reviews/my — user's reviews
router.get('/my', auth, (req, res) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, e.name as event_name, e.cover_image
      FROM reviews r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('Get my reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/reviews/:id — delete own review
router.delete('/:id', auth, (req, res) => {
  try {
    const db = getDb();
    const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: toggle publish
router.put('/:id/toggle', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    db.prepare('UPDATE reviews SET is_published = ? WHERE id = ?').run(review.is_published ? 0 : 1, req.params.id);
    res.json({ success: true, message: 'Review toggled' });
  } catch (err) {
    console.error('Toggle review error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: list all reviews
router.get('/all', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const reviews = db.prepare(`
      SELECT r.*, e.name as event_name, u.name as user_name
      FROM reviews r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('List all reviews error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
