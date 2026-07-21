const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const testimonialRepo = require('../repositories/testimonialRepo');
const userRepo = require('../repositories/userRepo');
const adminAuth = require('../middleware/adminAuth');
const { sanitizeMultiline } = require('../utils/validation');

const router = express.Router();

const testimonialRules = [
  body('content').trim().isLength({ min: 2, max: 2000 }).withMessage('Content must be 2-2000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
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

// Public: Get all published testimonials (with user info)
router.get('/', (req, res) => {
  try {
    const testimonials = testimonialRepo.findPublished();
    res.json({ success: true, data: testimonials });
  } catch (err) {
    console.error('List testimonials error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Get all testimonials (including unpublished, with user info)
router.get('/all', adminAuth, (req, res) => {
  try {
    const testimonials = testimonialRepo.findAllWithUser();
    res.json({ success: true, data: testimonials });
  } catch (err) {
    console.error('List all testimonials error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Create a new testimonial
router.post('/', adminAuth, testimonialRules, handleErrors, (req, res) => {
  try {
    const { user_id, content, rating, is_published } = req.body;

    // If user_id provided, verify it exists
    if (user_id) {
      const user = userRepo.findById(user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    const id = uuidv4();
    const testimonialData = {
      id,
      user_id: user_id || null,
      content: sanitizeMultiline(content),
      rating: rating !== undefined ? rating : 5,
      is_published: is_published !== undefined ? (is_published ? 1 : 0) : 1,
    };

    const testimonial = testimonialRepo.create(testimonialData);
    const result = testimonialRepo.findByIdWithUser(id);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Testimonial created successfully',
    });
  } catch (err) {
    console.error('Create testimonial error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Update a testimonial
router.put('/:id', adminAuth, (req, res) => {
  try {
    const existing = testimonialRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const updates = {};
    const allowedFields = ['user_id', 'content', 'rating', 'is_published'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'content') updates[field] = sanitizeMultiline(req.body[field]);
        else if (field === 'is_published') {
          updates[field] = req.body[field] ? 1 : 0;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    if (updates.user_id) {
      const user = userRepo.findById(updates.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    const testimonial = testimonialRepo.update(req.params.id, updates);
    const result = testimonialRepo.findByIdWithUser(req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'Testimonial updated successfully',
    });
  } catch (err) {
    console.error('Update testimonial error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Delete a testimonial
router.delete('/:id', adminAuth, (req, res) => {
  try {
    const existing = testimonialRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    testimonialRepo.delete(req.params.id);
    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (err) {
    console.error('Delete testimonial error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
