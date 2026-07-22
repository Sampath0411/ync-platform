const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const contactRepo = require('../repositories/contactRepo');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

const contactRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Subject too long'),
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
];

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join('. '),
    });
  }
  next();
}

router.post('/', contactRules, handleErrors, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const id = uuidv4();
    const contactData = {
      id,
      name,
      email,
      subject: subject || null,
      message,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    const contact = await contactRepo.create(contactData);
    res.status(201).json({ success: true, data: contact, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Submit contact error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const { is_read, page = 1, limit = 50 } = req.query;

    let messages;
    if (is_read === '0') {
      messages = await contactRepo.findUnread();
    } else {
      const db = getFirestore();
      const p = Math.max(1, parseInt(page, 10));
      const l = Math.min(100, parseInt(limit, 10));
      const offset = (p - 1) * l;

      const snap = await db.collection('contact_messages')
        .orderBy('created_at', 'desc')
        .limit(l)
        .offset(offset)
        .get();

      messages = snapshotToArray(snap);
    }

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('List contact messages error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/read', adminAuth, async (req, res) => {
  try {
    const message = await contactRepo.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await contactRepo.update(req.params.id, { is_read: 1 });
    res.json({ success: true, message: 'Message marked as read' });
  } catch (err) {
    console.error('Mark contact read error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
