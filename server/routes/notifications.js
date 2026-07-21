const express = require('express');
const { body, validationResult } = require('express-validator');
const notificationRepo = require('../repositories/notificationRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const notificationService = require('../services/notificationService');
const { sanitize, sanitizeMultiline } = require('../utils/validation');

const router = express.Router();

const sendRules = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
  body('type').optional().trim().isIn(['event_reminder', 'membership_approval', 'membership_rejection', 'event_cancellation', 'event_update', 'community_news', 'general']).withMessage('Invalid notification type'),
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

router.get('/', auth, (req, res) => {
  try {
    const notifications = notificationRepo.findByUser(req.user.id);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/unread-count', auth, (req, res) => {
  try {
    const count = notificationRepo.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/read', auth, (req, res) => {
  try {
    const notification = notificationRepo.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user_id && notification.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    notificationRepo.markAsRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/read-all', auth, (req, res) => {
  try {
    notificationRepo.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/send', adminAuth, sendRules, handleErrors, (req, res) => {
  try {
    const { user_id, type, title, message, is_global } = req.body;

    const sanitizedTitle = sanitize(title);
    const sanitizedMessage = sanitizeMultiline(message);

    let notification;
    if (is_global) {
      notification = notificationService.sendGlobalNotification(
        type || 'community_news',
        sanitizedTitle,
        sanitizedMessage
      );
    } else if (user_id) {
      notification = notificationService.createNotification(
        user_id,
        type || 'general',
        sanitizedTitle,
        sanitizedMessage
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Specify user_id for personal notification or is_global for global notification',
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification sent successfully',
    });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
