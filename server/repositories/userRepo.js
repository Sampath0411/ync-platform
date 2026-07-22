const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const db = getFirestore();
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async findByMembershipStatus(status) {
    const db = getFirestore();
    const snapshot = await db.collection('users')
      .where('membership_status', '==', status)
      .orderBy('created_at', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }

  async getStats() {
    const db = getFirestore();
    const allUsers = await db.collection('users').get();
    const total = allUsers.size;
    const today = new Date().toISOString().split('T')[0];
    let active = 0, activeMembers = 0, newToday = 0;

    allUsers.forEach(doc => {
      const u = doc.data();
      if (u.is_active) active++;
      if (u.membership_status === 'trial' || u.membership_status === 'active') activeMembers++;
      if (u.created_at && u.created_at.startsWith(today)) newToday++;
    });

    return { total, active, activeMembers, newToday };
  }

  async searchUsers(query, page = 1, limit = 20) {
    const db = getFirestore();
    page = Math.max(1, parseInt(page, 10));
    limit = Math.max(1, parseInt(limit, 10));
    const q = query.toLowerCase();

    const snapshot = await db.collection('users').orderBy('created_at', 'desc').get();
    const filtered = [];

    snapshot.forEach(doc => {
      const u = { id: doc.id, ...doc.data() };
      if ((u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.mobile && u.mobile.includes(query)) ||
          (u.city && u.city.toLowerCase().includes(q))) {
        filtered.push(u);
      }
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit).map(u => ({
      id: u.id, name: u.name, email: u.email, mobile: u.mobile,
      city: u.city, role: u.role, is_active: u.is_active,
      membership_status: u.membership_status, created_at: u.created_at,
    }));

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

module.exports = new UserRepository();
