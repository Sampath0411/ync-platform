const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class BookingRepository extends BaseRepository {
  constructor() {
    super('bookings');
  }

  findByUser(userId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT b.*, e.name as event_name, e.event_date, e.start_time, e.end_time, e.venue, e.cover_image
         FROM bookings b
         JOIN events e ON b.event_id = e.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(userId);
  }

  findByEvent(eventId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT b.*, u.name as user_name, u.email as user_email
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         WHERE b.event_id = ?
         ORDER BY b.created_at DESC`
      )
      .all(eventId);
  }

  getSalesStats(eventId) {
    const db = getDb();
    const stats = db
      .prepare(
        `SELECT COUNT(*) as total_bookings, COALESCE(SUM(quantity), 0) as total_tickets, COALESCE(SUM(total_amount), 0) as total_revenue
         FROM bookings
         WHERE event_id = ? AND status = 'confirmed'`
      )
      .get(eventId);
    return stats || { total_bookings: 0, total_tickets: 0, total_revenue: 0 };
  }
}

module.exports = new BookingRepository();
