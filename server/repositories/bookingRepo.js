const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class BookingRepository extends BaseRepository {
  constructor() {
    super('bookings');
  }

  async findByUser(userId) {
    const db = getFirestore();
    const snapshot = await db.collection('bookings')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const bookings = snapshotToArray(snapshot);

    // Enrich with event data
    const enriched = await Promise.all(bookings.map(async (b) => {
      const event = await getDoc('events', b.event_id);
      return {
        ...b,
        event_name: event?.name || null,
        event_date: event?.event_date || null,
        start_time: event?.start_time || null,
        end_time: event?.end_time || null,
        venue: event?.venue || null,
        cover_image: event?.cover_image || null,
      };
    }));

    return enriched;
  }

  async findByEvent(eventId) {
    const db = getFirestore();
    const snapshot = await db.collection('bookings')
      .where('event_id', '==', eventId)
      .orderBy('created_at', 'desc')
      .get();

    const bookings = snapshotToArray(snapshot);

    const enriched = await Promise.all(bookings.map(async (b) => {
      const user = await getDoc('users', b.user_id);
      return {
        ...b,
        user_name: user?.name || null,
        user_email: user?.email || null,
      };
    }));

    return enriched;
  }

  async getSalesStats(eventId) {
    const db = getFirestore();
    const snapshot = await db.collection('bookings')
      .where('event_id', '==', eventId)
      .where('status', '==', 'confirmed')
      .get();

    let total_bookings = 0, total_tickets = 0, total_revenue = 0;

    snapshot.forEach(doc => {
      const b = doc.data();
      total_bookings++;
      total_tickets += (b.quantity || 0);
      total_revenue += (b.total_amount || 0);
    });

    return { total_bookings, total_tickets, total_revenue };
  }
}

module.exports = new BookingRepository();
