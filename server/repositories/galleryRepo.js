const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class GalleryRepository extends BaseRepository {
  constructor() {
    super('gallery');
  }

  async findAllOrdered() {
    const db = getFirestore();
    const snapshot = await db.collection('gallery')
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }
}

module.exports = new GalleryRepository();
