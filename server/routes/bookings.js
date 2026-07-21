const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/init');
const bookingRepo = require('../repositories/bookingRepo');
const eventRepo = require('../repositories/eventRepo');
const ticketRepo = require('../repositories/ticketRepo');
const userRepo = require('../repositories/userRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const authOrAdmin = require('../middleware/authOrAdmin');
const ticketService = require('../services/ticketService');

const router = express.Router();

// ---- Validation rules ----
const bookingRules = [
  body('event_id').notEmpty().withMessage('Event ID is required'),
  body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
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

router.post('/', auth, bookingRules, handleErrors, (req, res) => {
  try {
    const { event_id, quantity = 1 } = req.body;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = eventRepo.findById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot book a cancelled event' });
    }

    // Check event hasn't passed
    if (new Date(event.event_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a past event' });
    }

    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    if (event.available_seats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${event.available_seats} seat(s) available` });
    }

    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMember = user.membership_status === 'trial' || user.membership_status === 'active';
    const unitPrice = isMember ? event.price : (event.non_member_price || event.price);
    const totalAmount = unitPrice * quantity;

    const bookingId = uuidv4();
    const db = getDb();

    // Perform seat check AND booking inside a transaction to prevent TOCTOU race
    const bookingTransaction = db.transaction(() => {
      // Re-check availability inside the transaction (atomic)
      const currentEvent = db.prepare('SELECT available_seats FROM events WHERE id = ?').get(event_id);
      if (!currentEvent || currentEvent.available_seats < quantity) {
        throw new Error(`Only ${currentEvent?.available_seats || 0} seat(s) available`);
      }

      // Check duplicate booking
      const existing = db.prepare(
        "SELECT id FROM bookings WHERE user_id = ? AND event_id = ? AND status = 'confirmed'"
      ).get(req.user.id, event_id);
      if (existing) {
        throw new Error('You already have a confirmed booking for this event');
      }

      const bookingData = {
        id: bookingId,
        user_id: user.id,
        event_id: event.id,
        quantity,
        total_amount: totalAmount,
      };

      bookingRepo.create(bookingData);
      eventRepo.updateAvailableSeats(event.id, -quantity);

      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4();
        const ticketData = { id: ticketId, booking_id: bookingId, user_id: user.id, event_id: event.id };
        const { ticketNumber, qrCodeData, barcodeData } = ticketService.prepareTicketData(ticketData, event, user);

        db.prepare(
          'INSERT INTO tickets (id, booking_id, user_id, event_id, ticket_number, qr_code_data, barcode_data) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(ticketId, bookingId, user.id, event.id, ticketNumber, qrCodeData, barcodeData);
      }
    });

    try {
      bookingTransaction();
    } catch (txErr) {
      return res.status(400).json({ success: false, message: txErr.message });
    }

    const booking = bookingRepo.findById(bookingId);
    const tickets = ticketRepo.findWhere({ booking_id: bookingId });

    res.status(201).json({
      success: true,
      data: { booking, tickets },
      message: 'Booking confirmed successfully',
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /my — unchanged
router.get('/my', auth, (req, res) => {
  try {
    const bookings = bookingRepo.findByUser(req.user.id);
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /:id — supports both user and admin tokens
router.get('/:id', authOrAdmin, (req, res) => {
  try {
    const db = getDb();
    const booking = db.prepare(
      `SELECT b.*, e.name as event_name, e.event_date, e.start_time, e.end_time, e.venue, e.cover_image, u.name as user_name
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`
    ).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow if owner or admin
    if (booking.user_id !== req.user?.id && !req.admin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tickets = ticketRepo.findWhere({ booking_id: req.params.id });

    res.json({
      success: true,
      data: { ...booking, tickets },
    });
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/cancel', auth, (req, res) => {
  try {
    const booking = bookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const db = getDb();
    const cancelTransaction = db.transaction(() => {
      bookingRepo.update(req.params.id, { status: 'cancelled' });
      eventRepo.updateAvailableSeats(booking.event_id, booking.quantity);
      db.prepare("UPDATE tickets SET status = 'cancelled' WHERE booking_id = ?").run(req.params.id);

      // Auto-promote from waitlist when seats free up
      const waitlistEntry = db.prepare(
        "SELECT * FROM waitlist WHERE event_id = ? AND status = 'waiting' ORDER BY created_at ASC LIMIT 1"
      ).get(booking.event_id);
      if (waitlistEntry) {
        db.prepare("UPDATE waitlist SET status = 'promoted', notified_at = datetime('now') WHERE id = ?").run(waitlistEntry.id);
        // Create notification for promoted user
        const notificationId = require('uuid').v4();
        const event = eventRepo.findById(booking.event_id);
        db.prepare(
          'INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)'
        ).run(notificationId, waitlistEntry.user_id, 'event', 'Seats Available!',
          `Great news! Seats have opened up for "${event?.name || 'an event'}". Book now before they're gone!`);

        // Emit socket event
        try { const io = req.app.get('io'); if (io) io.to(`user:${waitlistEntry.user_id}`).emit('waitlist_promoted', { event_id: booking.event_id }); } catch {}
      }
    });

    cancelTransaction();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
