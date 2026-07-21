const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  findByUser(userId) {
    const db = getDb();
    return db
      .prepare(
        "SELECT * FROM notifications WHERE user_id = ? OR is_global = 1 ORDER BY created_at DESC"
      )
      .all(userId);
  }

  getUnreadCount(userId) {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR is_global = 1) AND is_read = 0"
      )
      .get(userId);
    return row ? row.count : 0;
  }

  markAsRead(id) {
    const db = getDb();
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    return this.findById(id);
  }

  markAllAsRead(userId) {
    const db = getDb();
    db.prepare("UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR is_global = 1) AND is_read = 0").run(userId);
    return { success: true };
  }

  createGlobal(data) {
    const db = getDb();
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    data.id = id;
    data.is_global = 1;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    db.prepare(`INSERT INTO notifications (${columns}) VALUES (${placeholders})`).run(...values);
    return this.findById(id);
  }
}

module.exports = new NotificationRepository();
