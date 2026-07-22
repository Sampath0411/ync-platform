const express = require('express');
const { checkExpiredMemberships } = require('../services/membershipExpiry');

const router = express.Router();

function verifyCron(req, res, next) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(500).json({ success: false, message: 'CRON_SECRET is not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const queryToken = req.query.secret;

  if (bearerToken !== expected && queryToken !== expected) {
    return res.status(401).json({ success: false, message: 'Unauthorized cron request' });
  }

  next();
}

router.get('/membership-expiry', verifyCron, async (req, res) => {
  try {
    const expiredCount = await checkExpiredMemberships();
    res.json({
      success: true,
      message: 'Membership expiry check completed',
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Cron membership expiry error:', err);
    res.status(500).json({ success: false, message: 'Membership expiry check failed' });
  }
});

module.exports = router;
