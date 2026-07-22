const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');

class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async findAll() {
    const db = getFirestore();
    const snapshot = await db.collection(this.collectionName).get();
    return snapshotToArray(snapshot);
  }

  async findById(id) {
    return getDoc(this.collectionName, id);
  }

  async create(data) {
    const db = getFirestore();
    const id = data.id;
    await db.collection(this.collectionName).doc(id).set(data);
    return this.findById(id);
  }

  async update(id, data) {
    const db = getFirestore();
    await db.collection(this.collectionName).doc(id).update(data);
    return this.findById(id);
  }

  async delete(id) {
    const db = getFirestore();
    await db.collection(this.collectionName).doc(id).delete();
    return true;
  }

  async findWhere(conditions) {
    const db = getFirestore();
    let query = db.collection(this.collectionName);
    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, '==', value);
    }
    const snapshot = await query.get();
    return snapshotToArray(snapshot);
  }

  async count(conditions = {}) {
    const db = getFirestore();
    let query = db.collection(this.collectionName);
    for (const [key, value] of Object.entries(conditions)) {
      query = query.where(key, '==', value);
    }
    const snapshot = await query.get();
    return snapshot.size;
  }

  async paginate({ page = 1, limit = 20, conditions = {}, orderBy = 'created_at', orderDir = 'desc' } = {}) {
    const db = getFirestore();
    page = Math.max(1, parseInt(page, 10));
    limit = Math.max(1, Math.min(100, parseInt(limit, 10)));

    let query = db.collection(this.collectionName);

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        query = query.where(key, '==', value);
      }
    }

    query = query.orderBy(orderBy, orderDir);

    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    const offset = (page - 1) * limit;
    const snapshot = await query.limit(limit).offset(offset).get();
    const data = snapshotToArray(snapshot);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = BaseRepository;
