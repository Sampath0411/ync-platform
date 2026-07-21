const express = require('express');
const { getDb } = require('../db/init');
const userRepo = require('../repositories/userRepo');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Users management route (used by admin UsersManagement page)
router.get('/', adminAuth, (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;
    let result;
    if (search) {
      result = userRepo.searchUsers(search, parseInt(page, 10), parseInt(limit, 10));
    } else {
      result = userRepo.paginate(parseInt(page, 10), parseInt(limit, 10));
    }
    if (status && status !== 'all') {
      const isActive = status === 'active' ? 1 : 0;
      result.data = result.data.filter(u => u.is_active === isActive);
    }
    result.data = result.data.map(u => { const { password_hash, ...rest } = u; return rest; });
    res.json({ success: true, users: result.data, total: result.total, totalPages: result.totalPages || Math.ceil((result.total || 0) / parseInt(limit, 10)) || 1 });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, (req, res) => {
  try {
    const user = userRepo.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { status: newStatus } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (newStatus === 'active') updates.is_active = 1;
    else if (newStatus === 'inactive') updates.is_active = 0;
    userRepo.update(req.params.id, updates);
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
