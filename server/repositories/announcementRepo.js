const BaseRepository = require('./base');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super('announcements');
  }

  findPublished() {
    const db = require('../db/init').getDb();
    return db
      .prepare("SELECT * FROM announcements WHERE is_published = 1 ORDER BY created_at DESC")
      .all();
  }

  findByType(type) {
    const db = require('../db/init').getDb();
    return db
      .prepare("SELECT * FROM announcements WHERE type = ? AND is_published = 1 ORDER BY created_at DESC")
      .all(type);
  }
}

module.exports = new AnnouncementRepository();
