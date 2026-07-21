const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
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

router.post('/', contactRules, handleErrors, (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const id = uuidv4();
    const contactData = {
      id,
      name,
      email,
      subject: subject || null,
      message,
    };

    const contact = contactRepo.create(contactData);
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Message sent successfully',
    });
  } catch (err) {
    console.error('Submit contact error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/', adminAuth, (req, res) => {
  try {
    const { is_read, page = 1, limit = 50 } = req.query;

    let messages;
    if (is_read === '0') {
      messages = contactRepo.findUnread();
    } else {
      const db = require('../db/init').getDb();
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      messages = db
        .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .all(parseInt(limit, 10), offset);
    }

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('List contact messages error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/read', adminAuth, (req, res) => {
  try {
    const message = contactRepo.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    contactRepo.update(req.params.id, { is_read: 1 });
    res.json({ success: true, message: 'Message marked as read' });
  } catch (err) {
    console.error('Mark contact read error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
