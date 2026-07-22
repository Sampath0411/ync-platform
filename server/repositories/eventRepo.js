const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  async findByStatus(status) {
    const db = getFirestore();
    const snapshot = await db.collection('events')
      .where('status', '==', status)
      .orderBy('event_date', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }

  async findUpcoming() {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];

    // Firestore can't do OR queries — fetch both statuses and combine
    const snap1 = await db.collection('events')
      .where('status', '==', 'upcoming')
      .orderBy('event_date', 'asc')
      .get();

    const snap2 = await db.collection('events')
      .where('status', '==', 'ongoing')
      .orderBy('event_date', 'asc')
      .get();

    const results = snapshotToArray(snap1).concat(snapshotToArray(snap2));
    return results
      .filter(e => e.event_date >= today)
      .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));
  }

  async findByCategory(category) {
    const db = getFirestore();
    const snapshot = await db.collection('events')
      .where('category', '==', category)
      .orderBy('event_date', 'desc')
      .get();
    return snapshotToArray(snapshot);
  }

  async searchEvents(query, page = 1, limit = 20) {
    const db = getFirestore();
    page = Math.max(1, parseInt(page, 10));
    limit = Math.max(1, parseInt(limit, 10));
    const q = query.toLowerCase();

    const snapshot = await db.collection('events').orderBy('event_date', 'desc').get();
    const filtered = [];

    snapshot.forEach(doc => {
      const e = { id: doc.id, ...doc.data() };
      if ((e.name && e.name.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.organizer_name && e.organizer_name.toLowerCase().includes(q))) {
        filtered.push(e);
      }
    });

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateAvailableSeats(eventId, delta) {
    const event = await this.findById(eventId);
    if (!event) throw new Error('Event not found');

    const currentSeats = event.available_seats || 0;
    const newSeats = Math.max(0, currentSeats + delta);

    return this.update(eventId, {
      available_seats: newSeats,
      updated_at: new Date().toISOString(),
    });
  }
}

module.exports = new EventRepository();
