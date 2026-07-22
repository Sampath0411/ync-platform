const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');
const userRepo = require('../repositories/userRepo');
const eventRepo = require('../repositories/eventRepo');
const bookingRepo = require('../repositories/bookingRepo');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

function sanitizeCsvValue(val) {
  if (val == null) return '';
  const str = String(val);
  if (/^[=+\-@]/.test(str)) return "'" + str;
  return str.replace(/"/g, '""');
}

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();

    const [usersSnap, membershipsSnap, eventsSnap, ticketsSnap, bookingsSnap, contactSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('memberships').get(),
      db.collection('events').get(),
      db.collection('tickets').get(),
      db.collection('bookings').get(),
      db.collection('contact_messages').where('is_read', '==', 0).get(),
    ]);

    let totalUsers = 0, activeMembers = 0, pendingMemberships = 0;
    let totalEvents = 0, upcomingEvents = 0, completedEvents = 0;
    let ticketsSold = 0, todayCheckins = 0;
    let totalRevenue = 0, unreadMessages = contactSnap.size;

    const today = new Date().toISOString().split('T')[0];

    usersSnap.forEach(doc => {
      const u = doc.data();
      totalUsers++;
      if (u.membership_status === 'trial' || u.membership_status === 'active') activeMembers++;
    });

    membershipsSnap.forEach(doc => {
      if (doc.data().status === 'pending') pendingMemberships++;
    });

    eventsSnap.forEach(doc => {
      const e = doc.data();
      totalEvents++;
      if (e.status === 'upcoming' || e.status === 'ongoing') upcomingEvents++;
      if (e.status === 'completed') completedEvents++;
    });

    ticketsSnap.forEach(doc => {
      const t = doc.data();
      if (t.status !== 'cancelled') ticketsSold++;
      if (t.status === 'used' && t.validated_at && t.validated_at.startsWith(today)) todayCheckins++;
    });

    bookingsSnap.forEach(doc => {
      const b = doc.data();
      if (b.status === 'confirmed') totalRevenue += (b.total_amount || 0);
    });

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const userGrowthMap = {};
    usersSnap.forEach(doc => {
      const u = doc.data();
      if (u.created_at && u.created_at >= thirtyDaysAgo) {
        const date = u.created_at.split('T')[0];
        userGrowthMap[date] = (userGrowthMap[date] || 0) + 1;
      }
    });
    const userGrowth = Object.entries(userGrowthMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Event performance by category
    const catMap = {};
    eventsSnap.forEach(doc => {
      const e = doc.data();
      const cat = e.category || 'uncategorized';
      if (!catMap[cat]) catMap[cat] = { total: 0, completed: 0 };
      catMap[cat].total++;
      if (e.status === 'completed') catMap[cat].completed++;
    });
    const eventPerformance = Object.entries(catMap)
      .map(([category, data]) => ({ category, ...data }));

    res.json({
      success: true,
      data: {
        totalUsers, activeMembers, pendingMemberships,
        totalEvents, upcomingEvents, completedEvents,
        ticketsSold, todayCheckins, totalRevenue, unreadMessages,
        userGrowth, eventPerformance,
      },
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    let result;
    if (search) {
      result = await userRepo.searchUsers(search, p, l);
    } else {
      result = await userRepo.paginate({ page: p, limit: l });
    }
    if (status && status !== 'all') {
      const isActive = status === 'active' ? 1 : 0;
      result.data = result.data.filter(u => u.is_active === isActive);
    }
    result.data = result.data.map(u => { const { password_hash, ...rest } = u; return rest; });
    res.json({
      success: true, users: result.data,
      total: result.pagination?.total || 0,
      totalPages: result.pagination?.totalPages || 1,
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { status: newStatus } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (newStatus === 'active') updates.is_active = 1;
    else if (newStatus === 'inactive') updates.is_active = 0;
    else return res.status(400).json({ success: false, message: 'Status must be "active" or "inactive"' });
    await userRepo.update(req.params.id, updates);
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin' && user.is_active) {
      const db = getFirestore();
      const snap = await db.collection('users')
        .where('role', '==', 'admin')
        .where('is_active', '==', 1)
        .get();
      if (snap.size <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active admin' });
      }
    }

    await userRepo.update(req.params.id, {
      is_active: user.is_active ? 0 : 1,
      updated_at: new Date().toISOString(),
    });
    const status = user.is_active ? 'deactivated' : 'activated';
    res.json({ success: true, message: `User ${status} successfully` });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newPassword = 'YNC@' + Math.random().toString(36).slice(-6).toUpperCase();
    await userRepo.update(req.params.id, {
      password_hash: bcrypt.hashSync(newPassword, 10),
      updated_at: new Date().toISOString(),
    });

    console.log(`Password reset for user ${req.params.id} by admin ${req.admin?.id || 'unknown'}`);
    res.json({ success: true, data: { new_password: newPassword }, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { search, status, event_id, page = 1, limit = 15 } = req.query;
    const db = getFirestore();
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, parseInt(limit, 10));

    let query = db.collection('bookings').orderBy('created_at', 'desc');
    if (status && status !== 'all') query = query.where('status', '==', status);

    const snap = await query.get();
    let data = snapshotToArray(snap);

    // Enrich with user and event data
    data = await Promise.all(data.map(async (b) => {
      const [user, event] = await Promise.all([
        getDoc('users', b.user_id),
        getDoc('events', b.event_id),
      ]);
      return {
        ...b, user_name: user?.name || null, user_email: user?.email || null,
        event_name: event?.name || null, event_date: event?.event_date || null,
        event_venue: event?.venue || null,
      };
    }));

    // Client-side search filter
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(b =>
        b.id?.toLowerCase().includes(q) ||
        (b.user_name && b.user_name.toLowerCase().includes(q)) ||
        (b.event_name && b.event_name.toLowerCase().includes(q))
      );
    }

    if (event_id && event_id !== 'all') data = data.filter(b => b.event_id === event_id);

    const offset = (p - 1) * l;
    const paginated = data.slice(offset, offset + l);

    res.json({ success: true, data: paginated, bookings: paginated });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.patch('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'pending', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }

    const db = getFirestore();
    await db.collection('bookings').doc(req.params.id).update({ status });

    if (status === 'cancelled') {
      const booking = await bookingRepo.findById(req.params.id);
      if (booking) await eventRepo.updateAvailableSeats(booking.event_id, booking.quantity || 0);
    }

    res.json({ success: true, message: 'Booking updated' });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/tickets/validate', adminAuth, async (req, res) => {
  try {
    const { ticket_id, ticket_number } = req.body;
    const lookupValue = ticket_id || ticket_number;
    if (!lookupValue) return res.status(400).json({ success: false, message: 'Ticket ID or number required' });

    const db = getFirestore();
    let ticket = null;

    if (ticket_id) {
      ticket = await getDoc('tickets', ticket_id);
    } else {
      const snap = await db.collection('tickets').where('ticket_number', '==', ticket_number).limit(1).get();
      if (!snap.empty) ticket = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const [user, event] = await Promise.all([
      getDoc('users', ticket.user_id),
      getDoc('events', ticket.event_id),
    ]);

    res.json({
      success: true, status: ticket.status,
      ticket_id: ticket.id, ticket_number: ticket.ticket_number,
      user_name: user?.name || null, event_name: event?.name || null,
      event_date: event?.event_date || null, venue: event?.venue || null,
      checked_in_at: ticket.validated_at,
    });
  } catch (err) {
    console.error('Validate ticket error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/tickets/check-in', adminAuth, async (req, res) => {
  try {
    const { ticket_id } = req.body;
    if (!ticket_id) return res.status(400).json({ success: false, message: 'Ticket ID required' });

    const db = getFirestore();
    const ticket = await getDoc('tickets', ticket_id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'used') return res.status(400).json({ success: false, message: 'Ticket already used' });
    if (ticket.status === 'cancelled') return res.status(400).json({ success: false, message: 'Ticket is cancelled' });

    await db.collection('tickets').doc(ticket_id).update({
      status: 'used',
      validated_at: new Date().toISOString(),
    });

    const validationId = uuidv4();
    await db.collection('ticket_validations').doc(validationId).set({
      id: validationId,
      ticket_id,
      validator_id: req.admin?.id || 'admin',
      action: 'validated',
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Check-in successful', checked_in_at: new Date().toISOString() });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('notifications')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    const data = snapshotToArray(snap);
    res.json({ success: true, data, notifications: data });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/notifications/send', adminAuth, async (req, res) => {
  try {
    const { type, title, message, is_global, recipients, specific_users } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' });

    const db = getFirestore();
    const id = uuidv4();
    const now = new Date().toISOString();
    const batch = db.batch();

    if (is_global || recipients === 'all') {
      batch.set(db.collection('notifications').doc(id), {
        id, type: type || 'general', title, message, is_global: 1, created_at: now, is_read: 0,
      });
      await batch.commit();
    } else if (recipients === 'members') {
      const usersSnap = await db.collection('users').get();
      usersSnap.forEach(doc => {
        const u = doc.data();
        if (u.membership_status === 'trial' || u.membership_status === 'active') {
          const nId = uuidv4();
          batch.set(db.collection('notifications').doc(nId), {
            id: nId, user_id: u.id, type: type || 'general', title, message, is_read: 0, is_global: 0, created_at: now,
          });
        }
      });
      await batch.commit();
    } else if (recipients === 'specific' && specific_users) {
      let sentCount = 0;
      for (const email of specific_users) {
        const snap = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!snap.empty) {
          const nId = uuidv4();
          batch.set(db.collection('notifications').doc(nId), {
            id: nId, user_id: snap.docs[0].id, type: type || 'general', title, message, is_read: 0, is_global: 0, created_at: now,
          });
          sentCount++;
        }
      }
      await batch.commit();
      console.log(`Notification sent to ${sentCount}/${specific_users.length} specified users`);
    }

    res.json({ success: true, message: 'Notification sent', id });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/contact-messages', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('contact_messages').orderBy('created_at', 'desc').get();
    const data = snapshotToArray(snap);
    res.json({ success: true, data });
  } catch (err) {
    console.error('List contact messages error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/contact-messages/:id/read', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection('contact_messages').doc(req.params.id).update({ is_read: 1 });
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/contact-messages/:id/unread', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection('contact_messages').doc(req.params.id).update({ is_read: 0 });
    res.json({ success: true, message: 'Marked as unread' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/contact-messages/:id', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection('contact_messages').doc(req.params.id).delete();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/export/bookings', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('bookings').orderBy('created_at', 'desc').get();
    const bookings = [];

    for (const doc of snap.docs) {
      const b = { id: doc.id, ...doc.data() };
      const [user, event] = await Promise.all([
        getDoc('users', b.user_id),
        getDoc('events', b.event_id),
      ]);
      bookings.push({
        id: b.id, user_name: user?.name || '', user_email: user?.email || '',
        event_name: event?.name || '', event_date: event?.event_date || '',
        quantity: b.quantity || 0, total_amount: b.total_amount || 0,
        status: b.status || '', booking_date: b.booking_date || '',
      });
    }

    const headers = 'ID,User Name,User Email,Event Name,Event Date,Quantity,Total Amount,Status,Booking Date\n';
    const csv = bookings.map(b =>
      `"${sanitizeCsvValue(b.id)}","${sanitizeCsvValue(b.user_name)}","${sanitizeCsvValue(b.user_email)}","${sanitizeCsvValue(b.event_name)}","${sanitizeCsvValue(b.event_date)}",${b.quantity},${b.total_amount},"${sanitizeCsvValue(b.status)}","${sanitizeCsvValue(b.booking_date)}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings_export.csv');
    res.send('﻿' + headers + csv);
  } catch (err) {
    console.error('Export bookings error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/export/memberships', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('memberships').orderBy('created_at', 'desc').get();
    const memberships = [];

    for (const doc of snap.docs) {
      const m = { id: doc.id, ...doc.data() };
      const user = await getDoc('users', m.user_id);
      memberships.push({
        id: m.id, user_name: user?.name || '', user_email: user?.email || '',
        user_mobile: user?.mobile || '', status: m.status || '',
        membership_id: m.membership_id || '', expiry_date: m.expiry_date || '',
        request_date: m.request_date || '', reviewed_at: m.reviewed_at || '',
      });
    }

    const headers = 'ID,User Name,User Email,User Mobile,Status,Membership ID,Expiry Date,Request Date,Reviewed At\n';
    const csv = memberships.map(m =>
      `"${sanitizeCsvValue(m.id)}","${sanitizeCsvValue(m.user_name)}","${sanitizeCsvValue(m.user_email)}","${sanitizeCsvValue(m.user_mobile)}","${sanitizeCsvValue(m.status)}","${sanitizeCsvValue(m.membership_id)}","${sanitizeCsvValue(m.expiry_date)}","${sanitizeCsvValue(m.request_date)}","${sanitizeCsvValue(m.reviewed_at)}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=memberships_export.csv');
    res.send('﻿' + headers + csv);
  } catch (err) {
    console.error('Export memberships error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
