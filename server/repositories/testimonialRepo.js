const BaseRepository = require('./base');

class TestimonialRepository extends BaseRepository {
  constructor() {
    super('testimonials');
  }

  findPublished() {
    const db = require('../db/init').getDb();
    return db
      .prepare(
        `SELECT t.*, u.name as user_name, u.profile_photo as user_profile_photo
         FROM testimonials t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.is_published = 1
         ORDER BY t.created_at DESC`
      )
      .all();
  }

  findAllWithUser() {
    const db = require('../db/init').getDb();
    return db
      .prepare(
        `SELECT t.*, u.name as user_name, u.email as user_email, u.profile_photo as user_profile_photo
         FROM testimonials t
         LEFT JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
      )
      .all();
  }

  findByIdWithUser(id) {
    const db = require('../db/init').getDb();
    return db
      .prepare(
        `SELECT t.*, u.name as user_name, u.email as user_email, u.profile_photo as user_profile_photo
         FROM testimonials t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.id = ?`
      )
      .get(id);
  }
}

module.exports = new TestimonialRepository();
