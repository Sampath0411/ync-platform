const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
  }
  next();
}

// GET /api/waitlist/my — user's waitlist entries
router.get('/my', auth, (req, res) => {
  try {
    const db = getDb();
    const entries = db.prepare(`
      SELECT w.*, e.name as event_name, e.event_date, e.venue, e.cover_image, e.available_seats, e.max_capacity
      FROM waitlist w
      JOIN events e ON w.event_id = e.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id);
    res.json({ success: true, data: entries });
  } catch (err) {
    console.error('Get waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/waitlist/:eventId — join waitlist
router.post('/:eventId', auth, (req, res) => {
  try {
    const { eventId } = req.params;
    const quantity = Math.min(Math.max(parseInt(req.body.quantity) || 1, 1), 10);
    const db = getDb();

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.available_seats > 0) {
      return res.status(400).json({ success: false, message: 'Seats are available! Please book instead.' });
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot join waitlist for this event' });
    }

    const existing = db.prepare("SELECT id FROM waitlist WHERE user_id = ? AND event_id = ? AND status = 'waiting'").get(req.user.id, eventId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already on the waitlist for this event' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO waitlist (id, user_id, event_id, quantity, status) VALUES (?, ?, ?, ?, ?)'
    ).run(id, req.user.id, eventId, quantity, 'waiting');

    res.status(201).json({ success: true, data: { id }, message: 'Added to waitlist' });
  } catch (err) {
    console.error('Join waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/waitlist/:id — leave waitlist
router.delete('/:id', auth, (req, res) => {
  try {
    const db = getDb();
    const entry = db.prepare('SELECT * FROM waitlist WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }

    db.prepare("UPDATE waitlist SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) {
    console.error('Leave waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
