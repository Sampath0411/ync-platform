const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const announcementRepo = require('../repositories/announcementRepo');
const adminAuth = require('../middleware/adminAuth');
const { sanitize, sanitizeMultiline } = require('../utils/validation');

const router = express.Router();

const announcementRules = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'),
  body('type').optional().trim().isIn(['news', 'update', 'volunteer', 'notice']).withMessage('Invalid announcement type'),
  body('priority').optional().trim().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
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

router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    let announcements;
    if (type) {
      announcements = announcementRepo.findByType(type);
    } else {
      announcements = announcementRepo.findPublished();
    }
    res.json({ success: true, data: announcements });
  } catch (err) {
    console.error('List announcements error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', adminAuth, announcementRules, handleErrors, (req, res) => {
  try {
    const { title, content, type, priority, is_published } = req.body;

    const id = uuidv4();
    const announcementData = {
      id,
      title: sanitize(title),
      content: sanitizeMultiline(content),
      type: type || 'news',
      priority: priority || 'medium',
      is_published: is_published !== undefined ? (is_published ? 1 : 0) : 1,
    };

    const announcement = announcementRepo.create(announcementData);
    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, (req, res) => {
  try {
    const existing = announcementRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updates = { updated_at: new Date().toISOString() };
    const allowedFields = ['title', 'content', 'type', 'priority', 'is_published'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'title') updates[field] = sanitize(req.body[field]);
        else if (field === 'content') updates[field] = sanitizeMultiline(req.body[field]);
        else if (field === 'is_published') {
          updates[field] = req.body[field] ? 1 : 0;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const announcement = announcementRepo.update(req.params.id, updates);
    res.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });
  } catch (err) {
    console.error('Update announcement error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', adminAuth, (req, res) => {
  try {
    const existing = announcementRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcementRepo.delete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
