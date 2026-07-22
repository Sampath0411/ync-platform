const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class TicketRepository extends BaseRepository {
  constructor() {
    super('tickets');
  }

  async findByUser(userId) {
    const db = getFirestore();
    const snapshot = await db.collection('tickets')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();

    const tickets = snapshotToArray(snapshot);

    const enriched = await Promise.all(tickets.map(async (t) => {
      const event = await getDoc('events', t.event_id);
      return {
        ...t,
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
    const snapshot = await db.collection('tickets')
      .where('event_id', '==', eventId)
      .get();

    const tickets = snapshotToArray(snapshot);

    const enriched = await Promise.all(tickets.map(async (t) => {
      const user = await getDoc('users', t.user_id);
      return {
        ...t,
        user_name: user?.name || null,
        user_email: user?.email || null,
      };
    }));

    return enriched;
  }

  async findByTicketNumber(ticketNumber) {
    const db = getFirestore();
    const snapshot = await db.collection('tickets')
      .where('ticket_number', '==', ticketNumber)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const t = snapshot.docs[0];
    const ticket = { id: t.id, ...t.data() };

    const [event, user] = await Promise.all([
      getDoc('events', ticket.event_id),
      getDoc('users', ticket.user_id),
    ]);

    return {
      ...ticket,
      event_name: event?.name || null,
      event_date: event?.event_date || null,
      venue: event?.venue || null,
      user_name: user?.name || null,
    };
  }

  async updateStatus(id, status) {
    const updates = { status };
    if (status === 'used') {
      updates.validated_at = new Date().toISOString();
    } else {
      updates.validated_at = null;
    }
    return this.update(id, updates);
  }
}

module.exports = new TicketRepository();
