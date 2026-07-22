const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const sponsorRepo = require('../repositories/sponsorRepo');
const adminAuth = require('../middleware/adminAuth');
const { sanitize } = require('../utils/validation');

const router = express.Router();

const sponsorRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Sponsor name must be 2-200 characters'),
  body('website_url').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid website URL'),
  body('logo_url').optional({ values: 'falsy' }).trim().isURL().withMessage('Invalid logo URL'),
  body('sort_order').optional().isInt().withMessage('Sort order must be an integer'),
];

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join('. '),
    });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const sponsors = await sponsorRepo.findActive();
    res.json({ success: true, data: sponsors });
  } catch (err) {
    console.error('List sponsors error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/all', adminAuth, async (req, res) => {
  try {
    const sponsors = await sponsorRepo.findAll();
    res.json({ success: true, data: sponsors });
  } catch (err) {
    console.error('List all sponsors error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', adminAuth, sponsorRules, handleErrors, async (req, res) => {
  try {
    const { name, logo_url, website_url, sort_order, is_active } = req.body;

    const id = uuidv4();
    const sponsorData = {
      id,
      name: sanitize(name),
      logo_url: logo_url || null,
      website_url: website_url || null,
      sort_order: sort_order !== undefined ? sort_order : 0,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
      created_at: new Date().toISOString(),
    };

    const sponsor = await sponsorRepo.create(sponsorData);
    res.status(201).json({
      success: true,
      data: sponsor,
      message: 'Sponsor created successfully',
    });
  } catch (err) {
    console.error('Create sponsor error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const existing = await sponsorRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sponsor not found' });
    }

    const updates = {};
    const allowedFields = ['name', 'logo_url', 'website_url', 'sort_order', 'is_active'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'name') updates[field] = sanitize(req.body[field]);
        else if (field === 'is_active') updates[field] = req.body[field] ? 1 : 0;
        else updates[field] = req.body[field];
      }
    }

    const sponsor = await sponsorRepo.update(req.params.id, updates);
    res.json({
      success: true,
      data: sponsor,
      message: 'Sponsor updated successfully',
    });
  } catch (err) {
    console.error('Update sponsor error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const existing = await sponsorRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sponsor not found' });
    }

    await sponsorRepo.delete(req.params.id);
    res.json({ success: true, message: 'Sponsor deleted successfully' });
  } catch (err) {
    console.error('Delete sponsor error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
