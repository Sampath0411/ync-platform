/**
 * Membership expiry checker.
 * Run on startup and periodically to expire memberships past their expiry date.
 */
const { getDb } = require('../db/init');

/**
 * Check and expire memberships where expiry date has passed.
 * Returns the number of users expired.
 */
function checkExpiredMemberships() {
  try {
    const db = getDb();

    // Expire trial memberships past trial end
    const trialExpired = db.prepare(
      `UPDATE users SET membership_status = 'expired'
       WHERE membership_status IN ('trial')
       AND membership_expiry IS NOT NULL
       AND membership_expiry < datetime('now')`
    ).run();

    // Expire active memberships past expiry
    const activeExpired = db.prepare(
      `UPDATE users SET membership_status = 'expired'
       WHERE membership_status IN ('active')
       AND membership_expiry IS NOT NULL
       AND membership_expiry < datetime('now')`
    ).run();

    // Also expire related membership records
    db.prepare(
      `UPDATE memberships SET status = 'expired'
       WHERE status = 'approved'
       AND expiry_date IS NOT NULL
       AND expiry_date < datetime('now')`
    ).run();

    const totalExpired = (trialExpired?.changes || 0) + (activeExpired?.changes || 0);
    if (totalExpired > 0) {
      console.log(`Membership expiry: ${totalExpired} user(s) expired`);
    }

    return totalExpired;
  } catch (err) {
    console.error('Membership expiry check error:', err);
    return 0;
  }
}

module.exports = { checkExpiredMemberships };
