const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class ContactRepository extends BaseRepository {
  constructor() {
    super('contact_messages');
  }

  async findUnread() {
    const db = getFirestore();
    const snapshot = await db.collection('contact_messages')
      .where('is_read', '==', 0)
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }
}

module.exports = new ContactRepository();
