const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const bookingRepo = require('../repositories/bookingRepo');
const eventRepo = require('../repositories/eventRepo');
const ticketRepo = require('../repositories/ticketRepo');
const userRepo = require('../repositories/userRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const authOrAdmin = require('../middleware/authOrAdmin');
const ticketService = require('../services/ticketService');

const router = express.Router();

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

router.post('/', auth, bookingRules, handleErrors, async (req, res) => {
  try {
    const { event_id, quantity = 1 } = req.body;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await eventRepo.findById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot book a cancelled event' });
    }

    if (new Date(event.event_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a past event' });
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    if (event.available_seats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${event.available_seats} seat(s) available` });
    }

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMember = user.membership_status === 'trial' || user.membership_status === 'active';
    const unitPrice = isMember ? event.price : (event.non_member_price || event.price);
    const totalAmount = unitPrice * quantity;

    const bookingId = uuidv4();
    const db = getFirestore();

    // Check availability atomically
    const currentEvent = await getDoc('events', event_id);
    if (!currentEvent || currentEvent.available_seats < quantity) {
      return res.status(400).json({ success: false, message: `Only ${currentEvent?.available_seats || 0} seat(s) available` });
    }

    // Check duplicate booking
    const existingSnap = await db.collection('bookings')
      .where('user_id', '==', user.id)
      .where('event_id', '==', event_id)
      .where('status', '==', 'confirmed')
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({ success: false, message: 'You already have a confirmed booking for this event' });
    }

    // Use batch write for atomicity
    const batch = db.batch();

    const bookingData = {
      id: bookingId,
      user_id: user.id,
      event_id: event.id,
      quantity,
      total_amount: totalAmount,
      status: 'confirmed',
      booking_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    batch.set(db.collection('bookings').doc(bookingId), bookingData);

    // Update available seats
    const newSeats = Math.max(0, (currentEvent.available_seats || 0) - quantity);
    batch.update(db.collection('events').doc(event_id), {
      available_seats: newSeats,
      updated_at: new Date().toISOString(),
    });

    // Create tickets
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketId = uuidv4();
      const ticketData = { id: ticketId, booking_id: bookingId, user_id: user.id, event_id: event.id };
      const { ticketNumber, qrCodeData, barcodeData } = ticketService.prepareTicketData(ticketData, event, user);

      const ticketDoc = {
        id: ticketId,
        booking_id: bookingId,
        user_id: user.id,
        event_id: event.id,
        ticket_number: ticketNumber,
        qr_code_data: qrCodeData,
        barcode_data: barcodeData,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      batch.set(db.collection('tickets').doc(ticketId), ticketDoc);
      tickets.push(ticketDoc);
    }

    await batch.commit();

    res.status(201).json({
      success: true,
      data: { booking: bookingData, tickets },
      message: 'Booking confirmed successfully',
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await bookingRepo.findByUser(req.user.id);
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', authOrAdmin, async (req, res) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== req.user?.id && !req.admin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Enrich with event and user data
    const [event, user, tickets] = await Promise.all([
      getDoc('events', booking.event_id),
      getDoc('users', booking.user_id),
      ticketRepo.findWhere({ booking_id: req.params.id }),
    ]);

    res.json({
      success: true,
      data: {
        ...booking,
        event_name: event?.name || null,
        event_date: event?.event_date || null,
        start_time: event?.start_time || null,
        end_time: event?.end_time || null,
        venue: event?.venue || null,
        cover_image: event?.cover_image || null,
        user_name: user?.name || null,
        tickets,
      },
    });
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await bookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const db = getFirestore();
    const batch = db.batch();

    // Update booking status
    batch.update(db.collection('bookings').doc(req.params.id), { status: 'cancelled' });

    // Return seats
    const event = await getDoc('events', booking.event_id);
    if (event) {
      const returnedSeats = (event.available_seats || 0) + (booking.quantity || 0);
      batch.update(db.collection('events').doc(booking.event_id), {
        available_seats: returnedSeats,
        updated_at: new Date().toISOString(),
      });
    }

    // Cancel tickets
    const ticketsSnap = await db.collection('tickets').where('booking_id', '==', req.params.id).get();
    ticketsSnap.forEach(doc => {
      batch.update(doc.ref, { status: 'cancelled' });
    });

    // Auto-promote from waitlist
    const waitlistSnap = await db.collection('waitlist')
      .where('event_id', '==', booking.event_id)
      .where('status', '==', 'waiting')
      .orderBy('created_at', 'asc')
      .limit(1)
      .get();

    if (!waitlistSnap.empty) {
      const waitlistEntry = { id: waitlistSnap.docs[0].id, ...waitlistSnap.docs[0].data() };
      batch.update(db.collection('waitlist').doc(waitlistEntry.id), {
        status: 'promoted',
        notified_at: new Date().toISOString(),
      });

      // Create notification
      const notificationId = uuidv4();
      batch.set(db.collection('notifications').doc(notificationId), {
        id: notificationId,
        user_id: waitlistEntry.user_id,
        type: 'event',
        title: 'Seats Available!',
        message: `Great news! Seats have opened up for "${event?.name || 'an event'}". Book now before they're gone!`,
        is_read: 0,
        is_global: 0,
        created_at: new Date().toISOString(),
      });

      // Emit socket event
      try {
        const io = req.app.get('io');
        if (io) io.to(`user:${waitlistEntry.user_id}`).emit('waitlist_promoted', { event_id: booking.event_id });
      } catch {}
    }

    await batch.commit();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
