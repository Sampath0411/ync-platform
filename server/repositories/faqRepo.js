const BaseRepository = require('./base');

class FaqRepository extends BaseRepository {
  constructor() {
    super('faqs');
  }

  findPublished() {
    const db = require('../db/init').getDb();
    return db
      .prepare('SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC')
      .all();
  }

  findByCategory(category) {
    const db = require('../db/init').getDb();
    return db
      .prepare('SELECT * FROM faqs WHERE category = ? ORDER BY sort_order ASC, created_at DESC')
      .all(category);
  }
}

module.exports = new FaqRepository();
