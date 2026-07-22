const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class MembershipRepository extends BaseRepository {
  constructor() {
    super('memberships');
  }

  async findPending() {
    const db = getFirestore();
    const snapshot = await db.collection('memberships')
      .where('status', '==', 'pending')
      .orderBy('request_date', 'asc')
      .get();

    const memberships = snapshotToArray(snapshot);

    const enriched = await Promise.all(memberships.map(async (m) => {
      const user = await getDoc('users', m.user_id);
      return {
        ...m,
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_mobile: user?.mobile || null,
      };
    }));

    return enriched;
  }

  async findByUser(userId) {
    const db = getFirestore();
    const snapshot = await db.collection('memberships')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }

  async updateStatus(id, status, adminId, notes) {
    return this.update(id, {
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      admin_notes: notes || null,
      updated_at: new Date().toISOString(),
    });
  }

  async generateMembershipId() {
    const db = getFirestore();
    const prefix = 'YNC-MEM-';

    const snapshot = await db.collection('memberships')
      .where('membership_id', '!=', null)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    let num = 1;
    if (!snapshot.empty) {
      const last = snapshot.docs[0].data();
      if (last.membership_id) {
        const parts = last.membership_id.split('-');
        num = parseInt(parts[parts.length - 1], 10) + 1;
      }
    }
    return `${prefix}${String(num).padStart(6, '0')}`;
  }
}

module.exports = new MembershipRepository();
