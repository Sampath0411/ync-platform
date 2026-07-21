const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const membershipRepo = require('../repositories/membershipRepo');
const userRepo = require('../repositories/userRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const membershipService = require('../services/membershipService');
const notificationService = require('../services/notificationService');
const { sanitize, sanitizeMultiline } = require('../utils/validation');

const router = express.Router();

const requestRules = [
  body('reason').trim().isLength({ min: 2, max: 1000 }).withMessage('Reason must be 2-1000 characters'),
  body('identification_url').optional({ values: 'falsy' }).trim(),
];

const adminNotesRules = [
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Notes too long'),
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

router.post('/request', auth, requestRules, handleErrors, (req, res) => {
  try {
    const { reason, identification_url } = req.body;
    const sanitizedReason = sanitizeMultiline(reason);

    const existing = membershipRepo.findWhere({ user_id: req.user.id, status: 'pending' });
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending membership request' });
    }

    const previous = membershipRepo.findWhere({ user_id: req.user.id });
    const hasApproved = previous.some((m) => m.status === 'approved');
    if (hasApproved) {
      return res.status(400).json({ success: false, message: 'You already have an approved membership' });
    }

    const id = uuidv4();
    const membershipData = {
      id,
      user_id: req.user.id,
      reason: sanitizedReason,
      identification_url: identification_url || null,
      status: 'pending',
    };

    const membership = membershipRepo.create(membershipData);

    notificationService.createNotification(
      req.user.id,
      'general',
      'Membership Request Submitted',
      'Your YNC membership request has been submitted for review. We will notify you once it is processed.'
    );

    res.status(201).json({
      success: true,
      data: membership,
      message: 'Membership request submitted successfully',
    });
  } catch (err) {
    console.error('Membership request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/my', auth, (req, res) => {
  try {
    const memberships = membershipRepo.findByUser(req.user.id);

    const user = userRepo.findById(req.user.id);
    const userData = user ? { name: user.name, email: user.email, mobile: user.mobile, city: user.city } : {};

    res.json({
      success: true,
      data: {
        memberships,
        currentStatus: user ? {
          membership_status: user.membership_status,
          membership_trial_start: user.membership_trial_start,
          membership_expiry: user.membership_expiry,
        } : null,
        user: userData,
      },
    });
  } catch (err) {
    console.error('Get my memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/', adminAuth, (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let data;
    if (status === 'pending') {
      data = membershipRepo.findPending();
    } else if (status) {
      const db = getDb();
      data = db
        .prepare(
          `SELECT m.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
           FROM memberships m
           JOIN users u ON m.user_id = u.id
           WHERE m.status = ?
           ORDER BY m.created_at DESC`
        )
        .all(status);
    } else {
      const db = getDb();
      data = db
        .prepare(
          `SELECT m.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
           FROM memberships m
           JOIN users u ON m.user_id = u.id
           ORDER BY m.created_at DESC`
        )
        .all();
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('List memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/approve', adminAuth, (req, res) => {
  try {
    const membership = membershipRepo.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${membership.status} request` });
    }

    const membershipId = membershipService.generateMembershipId();
    const expiryDate = membershipService.calculateExpiryDate();
    const benefits = membershipService.getMemberBenefits();

    const qrData = JSON.stringify({
      mid: membershipId,
      uid: membership.user_id,
      exp: expiryDate,
    });

    const db = getDb();
    const approveTransaction = db.transaction(() => {
      membershipRepo.updateStatus(req.params.id, 'approved', req.admin.id, null);

      membershipRepo.update(req.params.id, {
        membership_id: membershipId,
        expiry_date: expiryDate,
        qr_code_data: qrData,
        benefits,
        updated_at: new Date().toISOString(),
      });

      userRepo.update(membership.user_id, {
        membership_status: 'active',
        membership_expiry: expiryDate,
        updated_at: new Date().toISOString(),
      });
    });

    approveTransaction();

    notificationService.sendMembershipNotification(membership.user_id, 'approved');

    const updated = membershipRepo.findById(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: 'Membership approved successfully',
    });
  } catch (err) {
    console.error('Approve membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/reject', adminAuth, adminNotesRules, handleErrors, (req, res) => {
  try {
    const { notes } = req.body;
    const membership = membershipRepo.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a ${membership.status} request` });
    }

    membershipRepo.updateStatus(req.params.id, 'rejected', req.admin.id, notes || null);

    notificationService.sendMembershipNotification(membership.user_id, 'rejected', notes);

    const updated = membershipRepo.findById(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: 'Membership rejected',
    });
  } catch (err) {
    console.error('Reject membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/return', adminAuth, adminNotesRules, handleErrors, (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ success: false, message: 'Notes are required when returning a request' });
    }

    const membership = membershipRepo.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership request not found' });
    }

    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot return a ${membership.status} request` });
    }

    membershipRepo.updateStatus(req.params.id, 'returned', req.admin.id, notes);

    notificationService.sendMembershipNotification(membership.user_id, 'returned', notes);

    const updated = membershipRepo.findById(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: 'Membership request returned for correction',
    });
  } catch (err) {
    console.error('Return membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
