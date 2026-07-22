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

router.get('/forms/:eventId', auth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('feedback_forms')
      .where('event_id', '==', req.params.eventId)
      .where('is_active', '==', 1)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ success: false, message: 'No active feedback form for this event' });
    }

    const form = { id: snap.docs[0].id, ...snap.docs[0].data() };

    const existingSnap = await db.collection('feedback_responses')
      .where('form_id', '==', form.id)
      .where('user_id', '==', req.user.id)
      .limit(1)
      .get();

    form.has_submitted = !existingSnap.empty;

    res.json({ success: true, data: form });
  } catch (err) {
    console.error('Get feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forms/:formId/respond', auth, [
  body('answers').isArray().withMessage('Answers must be an array'),
], handleErrors, async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const db = getFirestore();

    const form = await getDoc('feedback_forms', formId);
    if (!form || !form.is_active) {
      return res.status(404).json({ success: false, message: 'Feedback form not found or inactive' });
    }

    const existingSnap = await db.collection('feedback_responses')
      .where('form_id', '==', formId)
      .where('user_id', '==', req.user.id)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this form' });
    }

    const id = uuidv4();
    await db.collection('feedback_responses').doc(id).set({
      id, form_id: formId, user_id: req.user.id,
      answers,
      submitted_at: new Date().toISOString(),
    });

    res.status(201).json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/admin/forms', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('feedback_forms').orderBy('created_at', 'desc').get();

    const forms = [];
    for (const doc of snap.docs) {
      const f = { id: doc.id, ...doc.data() };
      const event = f.event_id ? await getDoc('events', f.event_id) : null;

      const respSnap = await db.collection('feedback_responses')
        .where('form_id', '==', f.id)
        .get();

      forms.push({ ...f, event_name: event?.name || null, response_count: respSnap.size });
    }

    res.json({ success: true, data: forms });
  } catch (err) {
    console.error('List feedback forms error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/admin/forms', adminAuth, [
  body('event_id').notEmpty().withMessage('Event ID is required'),
  body('title').isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
], handleErrors, async (req, res) => {
  try {
    const { event_id, title, description, questions } = req.body;
    const id = uuidv4();
    const db = getFirestore();

    await db.collection('feedback_forms').doc(id).set({
      id, event_id, title, description: description || null,
      questions, is_active: 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    const form = await getDoc('feedback_forms', id);
    res.status(201).json({ success: true, data: form, message: 'Feedback form created' });
  } catch (err) {
    console.error('Create feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/admin/forms/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, is_active } = req.body;
    const db = getFirestore();

    const existing = await getDoc('feedback_forms', id);
    if (!existing) return res.status(404).json({ success: false, message: 'Form not found' });

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (questions !== undefined) updates.questions = questions;
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;

    await db.collection('feedback_forms').doc(id).update(updates);
    const form = await getDoc('feedback_forms', id);
    res.json({ success: true, data: form, message: 'Form updated' });
  } catch (err) {
    console.error('Update feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/admin/forms/:id', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const existing = await getDoc('feedback_forms', req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Form not found' });

    // Delete form and responses
    const respSnap = await db.collection('feedback_responses')
      .where('form_id', '==', req.params.id)
      .get();

    const batch = db.batch();
    respSnap.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('feedback_forms').doc(req.params.id));
    await batch.commit();

    res.json({ success: true, message: 'Form deleted' });
  } catch (err) {
    console.error('Delete feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/admin/forms/:id/responses', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();

    const form = await getDoc('feedback_forms', req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const respSnap = await db.collection('feedback_responses')
      .where('form_id', '==', req.params.id)
      .orderBy('submitted_at', 'desc')
      .get();

    const responses = [];
    for (const doc of respSnap.docs) {
      const r = { id: doc.id, ...doc.data() };
      const user = r.user_id ? await getDoc('users', r.user_id) : null;
      responses.push({ ...r, user_name: user?.name || null });
    }

    res.json({ success: true, data: { form, responses } });
  } catch (err) {
    console.error('Get feedback responses error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
