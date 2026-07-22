const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class FaqRepository extends BaseRepository {
  constructor() {
    super('faqs');
  }

  async findPublished() {
    const db = getFirestore();
    const snapshot = await db.collection('faqs')
      .where('is_published', '==', 1)
      .orderBy('sort_order', 'asc')
      .get();
    return snapshotToArray(snapshot);
  }

  async findByCategory(category) {
    const db = getFirestore();
    const snapshot = await db.collection('faqs')
      .where('category', '==', category)
      .where('is_published', '==', 1)
      .orderBy('sort_order', 'asc')
      .get();
    return snapshotToArray(snapshot);
  }
}

module.exports = new FaqRepository();
