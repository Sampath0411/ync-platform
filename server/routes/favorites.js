const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites — list user's favorite events
router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const favorites = db.prepare(`
      SELECT f.id as fav_id, f.created_at as favorited_at, e.*
      FROM favorites f
      JOIN events e ON f.event_id = e.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);
    res.json({ success: true, data: favorites });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/favorites/:eventId — add to favorites
router.post('/:eventId', auth, (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getDb();

    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND event_id = ?').get(req.user.id, eventId);
    if (existing) {
      return res.json({ success: true, message: 'Already in favorites' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO favorites (id, user_id, event_id) VALUES (?, ?, ?)').run(id, req.user.id, eventId);

    res.status(201).json({ success: true, data: { id, event_id: eventId }, message: 'Added to favorites' });
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/favorites/:eventId — remove from favorites
router.delete('/:eventId', auth, (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getDb();

    const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND event_id = ?').run(req.user.id, eventId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/favorites/check/:eventId — check if event is favorited
router.get('/check/:eventId', auth, (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getDb();
    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND event_id = ?').get(req.user.id, eventId);
    res.json({ success: true, data: { is_favorited: !!existing } });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
