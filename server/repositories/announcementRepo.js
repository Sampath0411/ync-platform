const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super('announcements');
  }

  async findPublished() {
    const db = getFirestore();
    const snapshot = await db.collection('announcements')
      .where('is_published', '==', 1)
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }

  async findByType(type) {
    const db = getFirestore();
    const snapshot = await db.collection('announcements')
      .where('type', '==', type)
      .where('is_published', '==', 1)
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }
}

module.exports = new AnnouncementRepository();
