const BaseRepository = require('./base');

class GalleryRepository extends BaseRepository {
  constructor() {
    super('gallery');
  }

  findAllOrdered() {
    const db = require('../db/init').getDb();
    return db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
  }
}

module.exports = new GalleryRepository();
