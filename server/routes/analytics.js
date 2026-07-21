const express = require('express');
const { getDb } = require('../db/init');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/admin/analytics/overview — main dashboard stats
router.get('/overview', adminAuth, (req, res) => {
  try {
    const db = getDb();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1").get()?.count || 0;
    const totalMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE membership_status IN ('trial', 'active')").get()?.count || 0;
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get()?.count || 0;
    const upcomingEvents = db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'").get()?.count || 0;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get()?.count || 0;
    const confirmedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'").get()?.count || 0;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE status = ?').get('confirmed')?.total || 0;
    const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get()?.count || 0;

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

// GET /api/admin/analytics/revenue — revenue over time (monthly)
router.get('/revenue', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const months = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
             COUNT(*) as bookings,
             COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings WHERE status = 'confirmed'
      GROUP BY month ORDER BY month ASC LIMIT 12
    `).all();

    res.json({ success: true, data: months });
  } catch (err) {
    console.error('Analytics revenue error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/analytics/events — event popularity stats
router.get('/events', adminAuth, (req, res) => {
  try {
    const db = getDb();
    const popular = db.prepare(`
      SELECT e.id, e.name, e.category, e.event_date, e.status,
             COUNT(b.id) as booking_count,
             COALESCE(SUM(b.quantity), 0) as total_tickets,
             e.max_capacity
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      GROUP BY e.id
      ORDER BY booking_count DESC
      LIMIT 20
    `).all();

    // Category distribution
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count FROM events
      WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC
    `).all();

    // Status distribution
    const statusDistribution = db.prepare(`
      SELECT status, COUNT(*) as count FROM events
      GROUP BY status
    `).all();

    res.json({ success: true, data: { popular, categories, statusDistribution } });
  } catch (err) {
    console.error('Analytics events error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/analytics/users — user growth stats
router.get('/users', adminAuth, (req, res) => {
  try {
    const db = getDb();

    // User registrations by month
    const growth = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as registrations
      FROM users GROUP BY month ORDER BY month ASC LIMIT 12
    `).all();

    // Membership breakdown
    const memberships = db.prepare(`
      SELECT membership_status, COUNT(*) as count
      FROM users WHERE membership_status != 'none'
      GROUP BY membership_status
    `).all();

    // Gender distribution
    const genders = db.prepare(`
      SELECT gender, COUNT(*) as count FROM users
      WHERE gender IS NOT NULL AND gender != ''
      GROUP BY gender
    `).all();

    res.json({ success: true, data: { growth, memberships, genders } });
  } catch (err) {
    console.error('Analytics users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
