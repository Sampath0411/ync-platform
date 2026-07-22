const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class SponsorRepository extends BaseRepository {
  constructor() {
    super('sponsors');
  }

  async findActive() {
    const db = getFirestore();
    const snapshot = await db.collection('sponsors')
      .where('is_active', '==', 1)
      .orderBy('sort_order', 'asc')
      .get();
    return snapshotToArray(snapshot);
  }
}

module.exports = new SponsorRepository();
