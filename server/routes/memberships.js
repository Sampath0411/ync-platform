const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const membershipRepo = require('../repositories/membershipRepo');
const userRepo = require('../repositories/userRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
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

router.post('/request', auth, requestRules, handleErrors, async (req, res) => {
  try {
    const { reason, identification_url } = req.body;
    const sanitizedReason = sanitizeMultiline(reason);

    const existing = await membershipRepo.findWhere({ user_id: req.user.id, status: 'pending' });
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending membership request' });
    }

    const previous = await membershipRepo.findWhere({ user_id: req.user.id });
    const hasApproved = previous.some(m => m.status === 'approved');
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
      request_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const membership = await membershipRepo.create(membershipData);
    await notificationService.createNotification(
      req.user.id, 'general',
      'Membership Request Submitted',
      'Your YNC membership request has been submitted for review. We will notify you once it is processed.'
    );

    res.status(201).json({ success: true, data: membership, message: 'Membership request submitted successfully' });
  } catch (err) {
    console.error('Membership request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const memberships = await membershipRepo.findByUser(req.user.id);
    const user = await userRepo.findById(req.user.id);

    res.json({
      success: true,
      data: {
        memberships,
        currentStatus: user ? {
          membership_status: user.membership_status,
          membership_trial_start: user.membership_trial_start,
          membership_expiry: user.membership_expiry,
        } : null,
        user: user ? { name: user.name, email: user.email, mobile: user.mobile, city: user.city } : {},
      },
    });
  } catch (err) {
    console.error('Get my memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let data;

    if (status === 'pending') {
      data = await membershipRepo.findPending();
    } else if (status) {
      const memberships = await membershipRepo.findWhere({ status });
      const enriched = await Promise.all(memberships.map(async (m) => {
        const user = await getDoc('users', m.user_id);
        return { ...m, user_name: user?.name || null, user_email: user?.email || null, user_mobile: user?.mobile || null };
      }));
      data = enriched;
    } else {
      const db = getFirestore();
      const snap = await db.collection('memberships').orderBy('created_at', 'desc').get();
      const all = snapshotToArray(snap);
      data = await Promise.all(all.map(async (m) => {
        const user = await getDoc('users', m.user_id);
        return { ...m, user_name: user?.name || null, user_email: user?.email || null, user_mobile: user?.mobile || null };
      }));
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('List memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const membership = await membershipRepo.findById(req.params.id);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership request not found' });
    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${membership.status} request` });
    }

    const membershipId = await membershipRepo.generateMembershipId();
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const benefits = ['priority_booking', 'member_discounts', 'exclusive_events', 'early_access'];
    const qrData = JSON.stringify({ mid: membershipId, uid: membership.user_id, exp: expiryDate });

    // Update membership
    await membershipRepo.update(req.params.id, {
      status: 'approved',
      reviewed_by: req.admin.id,
      reviewed_at: new Date().toISOString(),
      membership_id: membershipId,
      expiry_date: expiryDate,
      qr_code_data: qrData,
      benefits,
      updated_at: new Date().toISOString(),
    });

    // Update user membership status
    await userRepo.update(membership.user_id, {
      membership_status: 'active',
      membership_expiry: expiryDate,
      updated_at: new Date().toISOString(),
    });

    await notificationService.sendMembershipNotification(membership.user_id, 'approved');

    const updated = await membershipRepo.findById(req.params.id);
    res.json({ success: true, data: updated, message: 'Membership approved successfully' });
  } catch (err) {
    console.error('Approve membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/reject', adminAuth, adminNotesRules, handleErrors, async (req, res) => {
  try {
    const { notes } = req.body;
    const membership = await membershipRepo.findById(req.params.id);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership request not found' });
    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a ${membership.status} request` });
    }

    await membershipRepo.updateStatus(req.params.id, 'rejected', req.admin.id, notes || null);
    await notificationService.sendMembershipNotification(membership.user_id, 'rejected', notes);

    const updated = await membershipRepo.findById(req.params.id);
    res.json({ success: true, data: updated, message: 'Membership rejected' });
  } catch (err) {
    console.error('Reject membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/return', adminAuth, adminNotesRules, handleErrors, async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ success: false, message: 'Notes are required when returning a request' });

    const membership = await membershipRepo.findById(req.params.id);
    if (!membership) return res.status(404).json({ success: false, message: 'Membership request not found' });
    if (membership.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot return a ${membership.status} request` });
    }

    await membershipRepo.updateStatus(req.params.id, 'returned', req.admin.id, notes);
    await notificationService.sendMembershipNotification(membership.user_id, 'returned', notes);

    const updated = await membershipRepo.findById(req.params.id);
    res.json({ success: true, data: updated, message: 'Membership request returned for correction' });
  } catch (err) {
    console.error('Return membership error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
