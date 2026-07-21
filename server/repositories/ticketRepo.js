const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class TicketRepository extends BaseRepository {
  constructor() {
    super('tickets');
  }

  findByUser(userId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.*, e.name as event_name, e.event_date, e.start_time, e.end_time, e.venue, e.cover_image
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         WHERE t.user_id = ?
         ORDER BY t.created_at DESC`
      )
      .all(userId);
  }

  findByEvent(eventId) {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.*, u.name as user_name, u.email as user_email
         FROM tickets t
         JOIN users u ON t.user_id = u.id
         WHERE t.event_id = ?`
      )
      .all(eventId);
  }

  findByTicketNumber(ticketNumber) {
    const db = getDb();
    return db
      .prepare(
        `SELECT t.*, e.name as event_name, e.event_date, e.venue, u.name as user_name
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         JOIN users u ON t.user_id = u.id
         WHERE t.ticket_number = ?`
      )
      .get(ticketNumber);
  }

  updateStatus(id, status) {
    const db = getDb();
    if (status === 'used') {
      db.prepare("UPDATE tickets SET status = ?, validated_at = datetime('now') WHERE id = ?").run(status, id);
    } else {
      db.prepare('UPDATE tickets SET status = ?, validated_at = NULL WHERE id = ?').run(status, id);
    }
    return this.findById(id);
  }
}

module.exports = new TicketRepository();
