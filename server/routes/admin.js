const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const userRepo = require('../repositories/userRepo');
const eventRepo = require('../repositories/eventRepo');
const bookingRepo = require('../repositories/bookingRepo');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

/**
 * Sanitize a value for CSV output to prevent CSV injection.
 * Fields starting with =, +, -, @ get prefixed with a single quote.
 */
function sanitizeCsvValue(val) {
  if (val == null) return '';
  const str = String(val);
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  // Escape double quotes
  return str.replace(/"/g, '""');
}

router.get('/stats', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const activeMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE membership_status IN ('trial', 'active')").get();
    const pendingMemberships = db.prepare("SELECT COUNT(*) as count FROM memberships WHERE status = 'pending'").get();
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get();
    const upcomingEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status IN ('upcoming', 'live')").get();
    const completedEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'completed'").get();
    const ticketsSold = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status != 'cancelled'").get();
    const todayCheckins = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE status = 'used' AND date(validated_at) = date('now')").get();
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE status = 'confirmed'").get();
    const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get();

    const userGrowth = db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= date('now', '-30 days') GROUP BY date(created_at) ORDER BY date`
    ).all();

    const eventPerformance = db.prepare(
      `SELECT category, COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM events GROUP BY category`
    ).all();

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.count,
        activeMembers: activeMembers.count,
        pendingMemberships: pendingMemberships.count,
        totalEvents: totalEvents.count,
        upcomingEvents: upcomingEvents.count,
        completedEvents: completedEvents.count,
        ticketsSold: ticketsSold.count,
        todayCheckins: todayCheckins.count,
        totalRevenue: totalRevenue.total,
        unreadMessages: unreadMessages.count,
        userGrowth,
        eventPerformance,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Alias for UsersManagement page — GET /users
router.get('/users', adminAuth, (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    let result;
    if (search) {
      result = userRepo.searchUsers(search, parseInt(page, 10), parseInt(limit, 10));
    } else {
      result = userRepo.paginate(parseInt(page, 10), parseInt(limit, 10));
    }
    if (status && status !== 'all') {
      const isActive = status === 'active' ? 1 : 0;
      result.data = result.data.filter(u => u.is_active === isActive);
    }
    result.data = result.data.map(u => { const { password_hash, ...rest } = u; return rest; });
    res.json({ success: true, users: result.data, total: result.total, totalPages: result.totalPages || Math.ceil((result.total || 0) / parseInt(limit, 10)) || 1 });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id', adminAuth, (req, res) => {
  try {
    const user = userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { status: newStatus } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (newStatus === 'active') updates.is_active = 1;
    else if (newStatus === 'inactive') updates.is_active = 0;
    else return res.status(400).json({ success: false, message: 'Status must be "active" or "inactive"' });
    userRepo.update(req.params.id, updates);
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id/toggle', adminAuth, (req, res) => {
  try {
    const user = userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent deactivating the last admin user (basic safety check)
    if (user.role === 'admin' && user.is_active) {
      const db = getDb();
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active admin' });
      }
    }

    userRepo.update(req.params.id, { is_active: user.is_active ? 0 : 1, updated_at: new Date().toISOString() });
    const status = user.is_active ? 'deactivated' : 'activated';
    res.json({ success: true, message: `User ${status} successfully` });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id/reset-password', adminAuth, (req, res) => {
  try {
    const user = userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newPassword = 'YNC@' + Math.random().toString(36).slice(-6).toUpperCase();
    userRepo.update(req.params.id, { password_hash: bcrypt.hashSync(newPassword, 10), updated_at: new Date().toISOString() });

    console.log(`Password reset for user ${req.params.id} by admin ${req.admin?.id || 'unknown'}`);
    res.json({ success: true, data: { new_password: newPassword }, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bookings management
router.get('/bookings', adminAuth, (req, res) => {
  try {
    const { search, status, event_id, page = 1, limit = 15 } = req.query;
    const db = getDb();
    let sql = `SELECT b.*, u.name as user_name, u.email as user_email, e.name as event_name, e.event_date, e.venue as event_venue
               FROM bookings b JOIN users u ON b.user_id = u.id JOIN events e ON b.event_id = e.id WHERE 1=1`;
    const params = [];
    if (search) { sql += ' AND (b.id LIKE ? OR u.name LIKE ? OR e.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status && status !== 'all') { sql += ' AND b.status = ?'; params.push(status); }
    if (event_id && event_id !== 'all') { sql += ' AND b.event_id = ?'; params.push(event_id); }
    sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    params.push(parseInt(limit, 10), offset);
    const data = db.prepare(sql).all(...params);
    res.json({ success: true, data, bookings: data });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/bookings/:id', adminAuth, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'pending', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required (confirmed, cancelled, pending, refunded)' });
    }
    const db = getDb();
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
    if (status === 'cancelled') {
      const booking = bookingRepo.findById(req.params.id);
      if (booking) eventRepo.updateAvailableSeats(booking.event_id, booking.quantity);
    }
    res.json({ success: true, message: 'Booking updated' });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Ticket validation (for scanner page)
router.post('/tickets/validate', adminAuth, (req, res) => {
  try {
    const { ticket_id, ticket_number } = req.body;
    const lookupValue = ticket_id || ticket_number;
    if (!lookupValue) return res.status(400).json({ success: false, message: 'Ticket ID or number required' });

    const db = getDb();
    const ticket = db.prepare(
      `SELECT t.*, u.name as user_name, u.email as user_email, e.name as event_name, e.event_date, e.venue
       FROM tickets t JOIN users u ON t.user_id = u.id JOIN events e ON t.event_id = e.id
       WHERE t.id = ? OR t.ticket_number = ?`
    ).get(lookupValue, lookupValue);

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const status = ticket.status;
    res.json({
      success: true, status, ticket_id: ticket.id, ticket_number: ticket.ticket_number,
      user_name: ticket.user_name, event_name: ticket.event_name, event_date: ticket.event_date,
      venue: ticket.venue, checked_in_at: ticket.validated_at,
    });
  } catch (err) {
    console.error('Validate ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/tickets/check-in', adminAuth, (req, res) => {
  try {
    const { ticket_id } = req.body;
    if (!ticket_id) return res.status(400).json({ success: false, message: 'Ticket ID required' });
    const db = getDb();
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket_id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'used') return res.status(400).json({ success: false, message: 'Ticket already used' });
    if (ticket.status === 'cancelled') return res.status(400).json({ success: false, message: 'Ticket is cancelled' });

    db.prepare("UPDATE tickets SET status = 'used', validated_at = datetime('now') WHERE id = ?").run(ticket_id);
    db.prepare('INSERT INTO ticket_validations (id, ticket_id, validator_id, action) VALUES (?, ?, ?, ?)').run(uuidv4(), ticket_id, req.admin?.id || 'admin', 'validated');

    res.json({ success: true, message: 'Check-in successful', checked_in_at: new Date().toISOString() });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Notifications
router.get('/notifications', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const data = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
    res.json({ success: true, data, notifications: data });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/notifications/send', adminAuth, (req, res) => {
  try {
    const { type, title, message, is_global, recipients, specific_users } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' });

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    if (is_global || recipients === 'all') {
      db.prepare('INSERT INTO notifications (id, type, title, message, is_global, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(id, type || 'general', title, message, now);
    } else if (recipients === 'members') {
      const members = db.prepare("SELECT id FROM users WHERE membership_status IN ('trial', 'active')").all();
      const insert = db.prepare('INSERT INTO notifications (id, user_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?)');
      members.forEach(m => insert.run(uuidv4(), m.id, type || 'general', title, message, now));
    } else if (recipients === 'specific' && specific_users) {
      let sentCount = 0;
      specific_users.forEach(email => {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (user) {
          db.prepare('INSERT INTO notifications (id, user_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), user.id, type || 'general', title, message, now);
          sentCount++;
        }
      });
      // Report how many were actually sent
      console.log(`Notification sent to ${sentCount}/${specific_users.length} specified users`);
    }

    res.json({ success: true, message: 'Notification sent', id });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Contact messages
router.get('/contact-messages', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const data = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    res.json({ success: true, data });
  } catch (err) {
    console.error('List contact messages error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/contact-messages/:id/read', adminAuth, (req, res) => {
  try {
    getDb().prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/contact-messages/:id/unread', adminAuth, (req, res) => {
  try {
    getDb().prepare('UPDATE contact_messages SET is_read = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Marked as unread' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/contact-messages/:id', adminAuth, (req, res) => {
  try {
    getDb().prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// CSV export — with injection protection
router.get('/export/bookings', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const bookings = db.prepare(
      `SELECT b.id, u.name as user_name, u.email as user_email, e.name as event_name, e.event_date, b.quantity, b.total_amount, b.status, b.booking_date
       FROM bookings b JOIN users u ON b.user_id = u.id JOIN events e ON b.event_id = e.id ORDER BY b.created_at DESC`
    ).all();
    const headers = 'ID,User Name,User Email,Event Name,Event Date,Quantity,Total Amount,Status,Booking Date\n';
    const csv = bookings.map(b =>
      `"${sanitizeCsvValue(b.id)}","${sanitizeCsvValue(b.user_name)}","${sanitizeCsvValue(b.user_email)}","${sanitizeCsvValue(b.event_name)}","${sanitizeCsvValue(b.event_date)}",${b.quantity},${b.total_amount},"${sanitizeCsvValue(b.status)}","${sanitizeCsvValue(b.booking_date)}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings_export.csv');
    res.send('﻿' + headers + csv); // BOM to prevent Excel encoding issues
  } catch (err) {
    console.error('Export bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/export/memberships', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const memberships = db.prepare(
      `SELECT m.id, u.name as user_name, u.email as user_email, u.mobile as user_mobile, m.status, m.membership_id, m.expiry_date, m.request_date, m.reviewed_at
       FROM memberships m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`
    ).all();
    const headers = 'ID,User Name,User Email,User Mobile,Status,Membership ID,Expiry Date,Request Date,Reviewed At\n';
    const csv = memberships.map(m =>
      `"${sanitizeCsvValue(m.id)}","${sanitizeCsvValue(m.user_name)}","${sanitizeCsvValue(m.user_email)}","${sanitizeCsvValue(m.user_mobile)}","${sanitizeCsvValue(m.status)}","${sanitizeCsvValue(m.membership_id)}","${sanitizeCsvValue(m.expiry_date)}","${sanitizeCsvValue(m.request_date)}","${sanitizeCsvValue(m.reviewed_at)}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=memberships_export.csv');
    res.send('﻿' + headers + csv); // BOM to prevent Excel encoding issues
  } catch (err) {
    console.error('Export memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
