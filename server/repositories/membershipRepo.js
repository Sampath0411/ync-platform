const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class MembershipRepository extends BaseRepository {
  constructor() {
    super('memberships');
  }

  findPending() {
    const db = getDb();
    return db
      .prepare(
        `SELECT m.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
         FROM memberships m
         JOIN users u ON m.user_id = u.id
         WHERE m.status = 'pending'
         ORDER BY m.request_date ASC`
      )
      .all();
  }

  findByUser(userId) {
    const db = getDb();
    return db
      .prepare('SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId);
  }

  updateStatus(id, status, adminId, notes) {
    const db = getDb();
    const stmt = db.prepare(
      "UPDATE memberships SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), admin_notes = ?, updated_at = datetime('now') WHERE id = ?"
    );
    stmt.run(status, adminId, notes, id);
    return this.findById(id);
  }

  generateMembershipId() {
    const db = getDb();
    const prefix = 'YNC-MEM-';
    const last = db
      .prepare("SELECT membership_id FROM memberships WHERE membership_id IS NOT NULL ORDER BY created_at DESC LIMIT 1")
      .get();
    let num = 1;
    if (last) {
      const parts = last.membership_id.split('-');
      num = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(num).padStart(6, '0')}`;
  }
}

module.exports = new MembershipRepository();
