const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const ticketRepo = require('../repositories/ticketRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const authOrAdmin = require('../middleware/authOrAdmin');

const router = express.Router();

router.get('/my', auth, (req, res) => {
  try {
    const tickets = ticketRepo.findByUser(req.user.id);
    res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('Get user tickets error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', authOrAdmin, (req, res) => {
  try {
    const ticket = ticketRepo.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user?.id && !req.admin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/validate', adminAuth, (req, res) => {
  try {
    const { ticket_number, qr_data } = req.body;

    if (!ticket_number && !qr_data) {
      return res.status(400).json({ success: false, message: 'Ticket number or QR data is required' });
    }

    let ticketNumber = ticket_number;

    if (qr_data && !ticket_number) {
      try {
        const parsed = JSON.parse(qr_data);
        ticketNumber = parsed.t;
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid QR data format' });
      }
    }

    const ticket = ticketRepo.findByTicketNumber(ticketNumber);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const db = getDb();
    const validationId = uuidv4();
    let action = 'validated';
    let notes = null;

    if (ticket.status === 'used') {
      action = 'duplicate';
      notes = 'Ticket already used';
    } else if (ticket.status === 'expired') {
      action = 'expired';
      notes = 'Ticket has expired';
    } else if (ticket.status === 'cancelled') {
      action = 'invalid';
      notes = 'Ticket has been cancelled';
    }

    if (action === 'validated') {
      ticketRepo.updateStatus(ticket.id, 'used');
    }

    db.prepare(
      'INSERT INTO ticket_validations (id, ticket_id, validator_id, action, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(validationId, ticket.id, req.admin.id, action, notes);

    if (action !== 'validated') {
      return res.status(400).json({
        success: false,
        data: { ticket, validation: { action, notes } },
        message: notes || 'Ticket is not valid',
      });
    }

    res.json({
      success: true,
      data: { ticket, validation: { id: validationId, action, notes } },
      message: 'Ticket validated successfully',
    });
  } catch (err) {
    console.error('Validate ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
