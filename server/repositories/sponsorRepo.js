const BaseRepository = require('./base');

class SponsorRepository extends BaseRepository {
  constructor() {
    super('sponsors');
  }

  findActive() {
    const db = require('../db/init').getDb();
    return db
      .prepare('SELECT * FROM sponsors WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC')
      .all();
  }
}

module.exports = new SponsorRepository();
