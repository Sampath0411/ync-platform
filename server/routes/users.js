const express = require('express');
const { getFirestore, snapshotToArray } = require('../db/firebase');
const userRepo = require('../repositories/userRepo');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);

    let result;
    if (search) {
      result = await userRepo.searchUsers(search, p, l);
    } else {
      result = await userRepo.paginate({ page: p, limit: l });
    }

    if (status && status !== 'all') {
      const isActive = status === 'active' ? 1 : 0;
      result.data = result.data.filter(u => u.is_active === isActive);
    }

    result.data = result.data.map(u => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    res.json({
      success: true,
      users: result.data,
      total: result.pagination?.total || result.total || 0,
      totalPages: result.pagination?.totalPages || 1,
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { status: newStatus } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (newStatus === 'active') updates.is_active = 1;
    else if (newStatus === 'inactive') updates.is_active = 0;

    await userRepo.update(req.params.id, updates);
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
