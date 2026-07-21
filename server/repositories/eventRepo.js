const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  findByStatus(status) {
    const db = getDb();
    return db.prepare('SELECT * FROM events WHERE status = ? ORDER BY event_date DESC').all(status);
  }

  findUpcoming() {
    const db = getDb();
    return db
      .prepare(
        "SELECT * FROM events WHERE status IN ('upcoming', 'live') AND event_date >= date('now') ORDER BY event_date ASC"
      )
      .all();
  }

  findByCategory(category) {
    const db = getDb();
    return db.prepare('SELECT * FROM events WHERE category = ? ORDER BY event_date DESC').all(category);
  }

  searchEvents(query, page = 1, limit = 20) {
    const db = getDb();
    const search = `%${query}%`;
    const offset = (page - 1) * limit;
    const countRow = db
      .prepare('SELECT COUNT(*) as total FROM events WHERE name LIKE ? OR description LIKE ? OR venue LIKE ? OR organizer_name LIKE ?')
      .get(search, search, search, search);
    const total = countRow ? countRow.total : 0;
    const rows = db
      .prepare("SELECT * FROM events WHERE name LIKE ? OR description LIKE ? OR venue LIKE ? OR organizer_name LIKE ? ORDER BY event_date DESC LIMIT ? OFFSET ?")
      .all(search, search, search, search, limit, offset);
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  updateAvailableSeats(eventId, delta) {
    const db = getDb();
    const sign = delta >= 0 ? '+' : '-';
    db.prepare(`UPDATE events SET available_seats = available_seats ${sign} ?, updated_at = datetime('now') WHERE id = ?`).run(
      Math.abs(delta),
      eventId
    );
    return this.findById(eventId);
  }
}

module.exports = new EventRepository();
