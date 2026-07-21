const BaseRepository = require('./base');

class ContactRepository extends BaseRepository {
  constructor() {
    super('contact_messages');
  }

  findUnread() {
    const db = require('../db/init').getDb();
    return db
      .prepare('SELECT * FROM contact_messages WHERE is_read = 0 ORDER BY created_at DESC')
      .all();
  }
}

module.exports = new ContactRepository();
