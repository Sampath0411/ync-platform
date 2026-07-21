const { getDb } = require('../db/init');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  findAll() {
    const db = getDb();
    return db.prepare(`SELECT * FROM ${this.tableName}`).all();
  }

  findById(id) {
    const db = getDb();
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
  }

  create(data) {
    const db = getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const stmt = db.prepare(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`);
    stmt.run(...values);
    return this.findById(data.id);
  }

  update(id, data) {
    const db = getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const stmt = db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
    return this.findById(id);
  }

  delete(id) {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    return stmt.run(id);
  }

  findWhere(conditions) {
    const db = getDb();
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');
    return db.prepare(`SELECT * FROM ${this.tableName} WHERE ${whereClause}`).all(...values);
  }

  paginate(page = 1, limit = 20, whereClause = '', params = []) {
    const db = getDb();
    const offset = (page - 1) * limit;
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM ${this.tableName} ${where}`).get(...params);
    const total = countRow ? countRow.total : 0;
    const rows = db
      .prepare(`SELECT * FROM ${this.tableName} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
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

module.exports = BaseRepository;
