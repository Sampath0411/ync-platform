const { getFirestore, snapshotToArray, getDoc } = require('../db/firebase');
const BaseRepository = require('./base');

class TestimonialRepository extends BaseRepository {
  constructor() {
    super('testimonials');
  }

  async findPublished() {
    const db = getFirestore();
    const snapshot = await db.collection('testimonials')
      .where('is_published', '==', 1)
      .orderBy('created_at', 'desc')
      .get();

    const testimonials = snapshotToArray(snapshot);

    const enriched = await Promise.all(testimonials.map(async (t) => {
      if (!t.user_id) return t;
      const user = await getDoc('users', t.user_id);
      return { ...t, user_name: user?.name || null, user_profile_photo: user?.profile_photo || null };
    }));

    return enriched;
  }

  async findAllWithUser() {
    const db = getFirestore();
    const snapshot = await db.collection('testimonials')
      .orderBy('created_at', 'desc')
      .get();

    const testimonials = snapshotToArray(snapshot);

    const enriched = await Promise.all(testimonials.map(async (t) => {
      if (!t.user_id) return t;
      const user = await getDoc('users', t.user_id);
      return {
        ...t,
        user_name: user?.name || null,
        user_email: user?.email || null,
        user_profile_photo: user?.profile_photo || null,
      };
    }));

    return enriched;
  }

  async findByIdWithUser(id) {
    const t = await this.findById(id);
    if (!t) return null;
    if (!t.user_id) return t;

    const user = await getDoc('users', t.user_id);
    return {
      ...t,
      user_name: user?.name || null,
      user_email: user?.email || null,
      user_profile_photo: user?.profile_photo || null,
    };
  }
}

module.exports = new TestimonialRepository();
