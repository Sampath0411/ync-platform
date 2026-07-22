const { getFirestore, snapshotToArray } = require('../db/firebase');
const BaseRepository = require('./base');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  async findByUser(userId) {
    const db = getFirestore();
    const snapshot = await db.collection('notifications')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const personal = snapshotToArray(snapshot);

    // Also get global notifications
    const globalSnap = await db.collection('notifications')
      .where('is_global', '==', 1)
      .orderBy('created_at', 'desc')
      .get();

    const global = snapshotToArray(globalSnap);

    // Merge and sort by created_at desc
    const combined = [...personal, ...global];
    combined.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return combined;
  }

  async getUnreadCount(userId) {
    const db = getFirestore();
    const snap1 = await db.collection('notifications')
      .where('user_id', '==', userId)
      .where('is_read', '==', 0)
      .get();

    const snap2 = await db.collection('notifications')
      .where('is_global', '==', 1)
      .where('is_read', '==', 0)
      .get();

    return snap1.size + snap2.size;
  }

  async markAsRead(id) {
    const db = getFirestore();
    await db.collection('notifications').doc(id).update({ is_read: 1 });
    return this.findById(id);
  }

  async markAllAsRead(userId) {
    const db = getFirestore();
    const snapshot = await db.collection('notifications')
      .where('user_id', '==', userId)
      .where('is_read', '==', 0)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { is_read: 1 });
    });
    await batch.commit();

    return { success: true };
  }

  async createGlobal(data) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const notification = { id, is_global: 1, ...data };
    return this.create(notification);
  }
}

module.exports = new NotificationRepository();
