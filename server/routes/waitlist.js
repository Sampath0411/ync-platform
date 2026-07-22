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

router.get('/my', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('waitlist')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();

    const entries = snapshotToArray(snapshot);

    const enriched = await Promise.all(entries.map(async (w) => {
      const event = await getDoc('events', w.event_id);
      return {
        ...w,
        event_name: event?.name || null,
        event_date: event?.event_date || null,
        venue: event?.venue || null,
        cover_image: event?.cover_image || null,
        available_seats: event?.available_seats || 0,
        max_capacity: event?.max_capacity || 0,
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('Get waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const quantity = Math.min(Math.max(parseInt(req.body.quantity) || 1, 1), 10);
    const db = getFirestore();

    const event = await getDoc('events', eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.available_seats > 0) {
      return res.status(400).json({ success: false, message: 'Seats are available! Please book instead.' });
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot join waitlist for this event' });
    }

    const existingSnap = await db.collection('waitlist')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', eventId)
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({ success: false, message: 'You are already on the waitlist for this event' });
    }

    const id = uuidv4();
    await db.collection('waitlist').doc(id).set({
      id,
      user_id: req.user.id,
      event_id: eventId,
      quantity,
      status: 'waiting',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: { id }, message: 'Added to waitlist' });
  } catch (err) {
    console.error('Join waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const entry = await getDoc('waitlist', req.params.id);

    if (!entry || entry.user_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }

    await db.collection('waitlist').doc(req.params.id).update({ status: 'cancelled' });
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) {
    console.error('Leave waitlist error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
