const express = require('express');
const { getFirestore, snapshotToArray } = require('../db/firebase');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/overview', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();

    const [usersSnap, eventsSnap, bookingsSnap, ticketsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('events').get(),
      db.collection('bookings').get(),
      db.collection('tickets').get(),
    ]);

    let totalUsers = 0, activeUsers = 0, totalMembers = 0;
    usersSnap.forEach(doc => {
      const u = doc.data();
      totalUsers++;
      if (u.is_active) activeUsers++;
      if (u.membership_status === 'trial' || u.membership_status === 'active') totalMembers++;
    });

    let totalEvents = 0, upcomingEvents = 0;
    eventsSnap.forEach(doc => {
      totalEvents++;
      if (doc.data().status === 'upcoming') upcomingEvents++;
    });

    let totalBookings = 0, confirmedBookings = 0, totalRevenue = 0;
    bookingsSnap.forEach(doc => {
      const b = doc.data();
      totalBookings++;
      if (b.status === 'confirmed') {
        confirmedBookings++;
        totalRevenue += (b.total_amount || 0);
      }
    });

    const totalTickets = ticketsSnap.size;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, members: totalMembers },
        events: { total: totalEvents, upcoming: upcomingEvents },
        bookings: { total: totalBookings, confirmed: confirmedBookings },
        revenue: totalRevenue,
        tickets: totalTickets,
      },
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .orderBy('created_at', 'asc')
      .get();

    // Group by month
    const monthMap = {};
    snap.forEach(doc => {
      const b = doc.data();
      if (b.created_at) {
        const month = b.created_at.substring(0, 7); // YYYY-MM
        if (!monthMap[month]) monthMap[month] = { month, bookings: 0, revenue: 0 };
        monthMap[month].bookings++;
        monthMap[month].revenue += (b.total_amount || 0);
      }
    });

    const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

    res.json({ success: true, data: months });
  } catch (err) {
    console.error('Analytics revenue error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/events', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();

    const [eventsSnap, bookingsSnap] = await Promise.all([
      db.collection('events').get(),
      db.collection('bookings').where('status', '==', 'confirmed').get(),
    ]);

    // Build booking counts per event
    const bookingCounts = {};
    const ticketCounts = {};
    bookingsSnap.forEach(doc => {
      const b = doc.data();
      if (b.event_id) {
        bookingCounts[b.event_id] = (bookingCounts[b.event_id] || 0) + 1;
        ticketCounts[b.event_id] = (ticketCounts[b.event_id] || 0) + (b.quantity || 0);
      }
    });

    const popular = [];
    const catMap = {};
    const statusMap = {};

    eventsSnap.forEach(doc => {
      const e = { id: doc.id, ...doc.data() };
      popular.push({
        id: e.id, name: e.name, category: e.category, event_date: e.event_date,
        status: e.status, max_capacity: e.max_capacity,
        booking_count: bookingCounts[e.id] || 0,
        total_tickets: ticketCounts[e.id] || 0,
      });

      const cat = e.category || 'uncategorized';
      catMap[cat] = (catMap[cat] || 0) + 1;

      const st = e.status || 'unknown';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    popular.sort((a, b) => b.booking_count - a.booking_count);
    const top20 = popular.slice(0, 20);

    const categories = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const statusDistribution = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }));

    res.json({ success: true, data: { popular: top20, categories, statusDistribution } });
  } catch (err) {
    console.error('Analytics events error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('users').get();

    const growthMap = {};
    const membershipMap = {};
    const genderMap = {};

    snap.forEach(doc => {
      const u = doc.data();

      // Growth by month
      if (u.created_at) {
        const month = u.created_at.substring(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      }

      // Membership breakdown
      if (u.membership_status && u.membership_status !== 'none') {
        membershipMap[u.membership_status] = (membershipMap[u.membership_status] || 0) + 1;
      }

      // Gender distribution
      if (u.gender && u.gender !== '') {
        genderMap[u.gender] = (genderMap[u.gender] || 0) + 1;
      }
    });

    const growth = Object.entries(growthMap)
      .map(([month, registrations]) => ({ month, registrations }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);

    const memberships = Object.entries(membershipMap)
      .map(([membership_status, count]) => ({ membership_status, count }));

    const genders = Object.entries(genderMap)
      .map(([gender, count]) => ({ gender, count }));

    res.json({ success: true, data: { growth, memberships, genders } });
  } catch (err) {
    console.error('Analytics users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
