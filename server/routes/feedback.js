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

// ===== PUBLIC ENDPOINTS =====

// GET /api/feedback/forms/:eventId — get active feedback form for an event
router.get('/forms/:eventId', auth, (req, res) => {
  try {
    const db = getDb();
    const form = db.prepare(
      'SELECT * FROM feedback_forms WHERE event_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(req.params.eventId);

    if (!form) {
      return res.status(404).json({ success: false, message: 'No active feedback form for this event' });
    }

    // Parse questions
    try { form.questions = JSON.parse(form.questions); } catch (e) { form.questions = []; }

    // Check if user already submitted
    const existing = db.prepare('SELECT id FROM feedback_responses WHERE form_id = ? AND user_id = ?').get(form.id, req.user.id);
    form.has_submitted = !!existing;

    res.json({ success: true, data: form });
  } catch (err) {
    console.error('Get feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/feedback/forms/:formId/respond — submit feedback response
router.post('/forms/:formId/respond', auth, [
  body('answers').isArray().withMessage('Answers must be an array'),
], handleErrors, (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const db = getDb();

    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ? AND is_active = 1').get(formId);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Feedback form not found or inactive' });
    }

    const existing = db.prepare('SELECT id FROM feedback_responses WHERE form_id = ? AND user_id = ?').get(formId, req.user.id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this form' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO feedback_responses (id, form_id, user_id, answers) VALUES (?, ?, ?, ?)'
    ).run(id, formId, req.user.id, JSON.stringify(answers));

    res.status(201).json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ===== ADMIN ENDPOINTS =====

// GET /api/feedback/admin/forms — list all feedback forms
router.get('/admin/forms', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const forms = db.prepare(`
      SELECT f.*, e.name as event_name,
        (SELECT COUNT(*) FROM feedback_responses WHERE form_id = f.id) as response_count
      FROM feedback_forms f
      JOIN events e ON f.event_id = e.id
      ORDER BY f.created_at DESC
    `).all();
    res.json({ success: true, data: forms });
  } catch (err) {
    console.error('List feedback forms error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/feedback/admin/forms — create feedback form
router.post('/admin/forms', adminAuth, [
  body('event_id').notEmpty().withMessage('Event ID is required'),
  body('title').isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
], handleErrors, (req, res) => {
  try {
    const { event_id, title, description, questions } = req.body;
    const id = uuidv4();
    const db = getDb();

    db.prepare(
      'INSERT INTO feedback_forms (id, event_id, title, description, questions) VALUES (?, ?, ?, ?, ?)'
    ).run(id, event_id, title, description || null, JSON.stringify(questions));

    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(id);
    try { form.questions = JSON.parse(form.questions); } catch (e) { form.questions = []; }
    res.status(201).json({ success: true, data: form, message: 'Feedback form created' });
  } catch (err) {
    console.error('Create feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/feedback/admin/forms/:id — update form
router.put('/admin/forms/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions, is_active } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Form not found' });

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (questions !== undefined) updates.questions = JSON.stringify(questions);
    if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
    updates.updated_at = new Date().toISOString();

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE feedback_forms SET ${setClause} WHERE id = ?`).run(...values, id);

    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(id);
    try { form.questions = JSON.parse(form.questions); } catch (e) { form.questions = []; }
    res.json({ success: true, data: form, message: 'Form updated' });
  } catch (err) {
    console.error('Update feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/feedback/admin/forms/:id — delete form
router.delete('/admin/forms/:id', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Form not found' });

    db.prepare('DELETE FROM feedback_forms WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM feedback_responses WHERE form_id = ?').run(req.params.id);
    res.json({ success: true, message: 'Form deleted' });
  } catch (err) {
    console.error('Delete feedback form error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/feedback/admin/forms/:id/responses — get form responses
router.get('/admin/forms/:id/responses', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const form = db.prepare('SELECT * FROM feedback_forms WHERE id = ?').get(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const responses = db.prepare(`
      SELECT r.*, u.name as user_name
      FROM feedback_responses r
      JOIN users u ON r.user_id = u.id
      WHERE r.form_id = ?
      ORDER BY r.submitted_at DESC
    `).all(req.params.id);

    // Parse answers
    responses.forEach(r => {
      try { r.answers = JSON.parse(r.answers); } catch (e) { r.answers = []; }
    });

    try { form.questions = JSON.parse(form.questions); } catch (e) { form.questions = []; }

    res.json({ success: true, data: { form, responses } });
  } catch (err) {
    console.error('Get feedback responses error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
