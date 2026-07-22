const { getFirestore } = require('../db/firebase');

async function checkExpiredMemberships() {
  try {
    const db = getFirestore();
    const now = new Date().toISOString();
    let totalExpired = 0;

    // Fetch all trial users and filter in-memory (avoids composite index requirement)
    const trialSnap = await db.collection('users')
      .where('membership_status', '==', 'trial')
      .get();

    const batch1 = db.batch();
    trialSnap.forEach(doc => {
      const data = doc.data();
      if (data.membership_expiry && data.membership_expiry < now) {
        batch1.update(doc.ref, { membership_status: 'expired' });
        totalExpired++;
      }
    });
    if (totalExpired > 0) await batch1.commit();

    // Fetch all active users and filter in-memory
    const activeSnap = await db.collection('users')
      .where('membership_status', '==', 'active')
      .get();

    const batch2 = db.batch();
    let activeExpired = 0;
    activeSnap.forEach(doc => {
      const data = doc.data();
      if (data.membership_expiry && data.membership_expiry < now) {
        batch2.update(doc.ref, { membership_status: 'expired' });
        activeExpired++;
      }
    });
    if (activeExpired > 0) await batch2.commit();

    // Expire related membership records
    const membershipsSnap = await db.collection('memberships')
      .where('status', '==', 'approved')
      .get();

    const batch3 = db.batch();
    let memExpired = 0;
    membershipsSnap.forEach(doc => {
      const data = doc.data();
      if (data.expiry_date && data.expiry_date < now) {
        batch3.update(doc.ref, { status: 'expired' });
        memExpired++;
      }
    });
    if (memExpired > 0) await batch3.commit();

    totalExpired += activeExpired;
    if (totalExpired > 0) {
      console.log(`Membership expiry: ${totalExpired} user(s) expired`);
    }

    return totalExpired;
  } catch (err) {
    console.error('Membership expiry check error:', err.message);
    return 0;
  }
}

module.exports = { checkExpiredMemberships };
