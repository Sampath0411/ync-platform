const { getDb } = require('../db/init');
const BaseRepository = require('./base');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  findByMembershipStatus(status) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE membership_status = ? ORDER BY created_at DESC').all(status);
  }

  getStats() {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const active = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
    const activeMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE membership_status IN ('trial', 'active')").get();
    const newToday = db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')").get();
    return {
      total: total.count,
      active: active.count,
      activeMembers: activeMembers.count,
      newToday: newToday.count,
    };
  }

  searchUsers(query, page = 1, limit = 20) {
    const db = getDb();
    const search = `%${query}%`;
    const offset = (page - 1) * limit;
    const countRow = db
      .prepare("SELECT COUNT(*) as total FROM users WHERE name LIKE ? OR email LIKE ? OR mobile LIKE ? OR city LIKE ?")
      .get(search, search, search, search);
    const total = countRow ? countRow.total : 0;
    const rows = db
      .prepare("SELECT id, name, email, mobile, city, role, is_active, membership_status, created_at FROM users WHERE name LIKE ? OR email LIKE ? OR mobile LIKE ? OR city LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
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
}

module.exports = new UserRepository();
