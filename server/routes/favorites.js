const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('favorites')
      .where('user_id', '==', req.user.id)
      .orderBy('created_at', 'desc')
      .get();

    const favorites = snapshotToArray(snapshot);

    // Enrich with event data
    const enriched = await Promise.all(favorites.map(async (fav) => {
      const event = await getDoc('events', fav.event_id);
      return event ? { fav_id: fav.id, favorited_at: fav.created_at, ...event } : null;
    }));

    res.json({ success: true, data: enriched.filter(Boolean) });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getFirestore();

    const event = await getDoc('events', eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existingSnap = await db.collection('favorites')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', eventId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.json({ success: true, message: 'Already in favorites' });
    }

    const id = uuidv4();
    await db.collection('favorites').doc(id).set({
      id,
      user_id: req.user.id,
      event_id: eventId,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, data: { id, event_id: eventId }, message: 'Added to favorites' });
  } catch (err) {
    console.error('Add favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getFirestore();

    const existingSnap = await db.collection('favorites')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', eventId)
      .limit(1)
      .get();

    if (existingSnap.empty) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    await db.collection('favorites').doc(existingSnap.docs[0].id).delete();
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/check/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getFirestore();

    const existingSnap = await db.collection('favorites')
      .where('user_id', '==', req.user.id)
      .where('event_id', '==', eventId)
      .limit(1)
      .get();

    res.json({ success: true, data: { is_favorited: !existingSnap.empty } });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
