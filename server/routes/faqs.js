const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const faqRepo = require('../repositories/faqRepo');
const adminAuth = require('../middleware/adminAuth');
const { sanitize, sanitizeMultiline } = require('../utils/validation');

const router = express.Router();

const faqRules = [
  body('question').trim().isLength({ min: 2, max: 500 }).withMessage('Question must be 2-500 characters'),
  body('answer').trim().isLength({ min: 2, max: 5000 }).withMessage('Answer must be 2-5000 characters'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Category too long'),
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

// Public: Get all published FAQs
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let faqs;
    if (category) {
      faqs = faqRepo.findByCategory(category);
    } else {
      faqs = faqRepo.findPublished();
    }
    res.json({ success: true, data: faqs });
  } catch (err) {
    console.error('List FAQs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Get all FAQs (including unpublished)
router.get('/all', adminAuth, (req, res) => {
  try {
    const faqs = faqRepo.findAll();
    res.json({ success: true, data: faqs });
  } catch (err) {
    console.error('List all FAQs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Create a new FAQ
router.post('/', adminAuth, faqRules, handleErrors, (req, res) => {
  try {
    const { question, answer, category, sort_order, is_published } = req.body;

    const id = uuidv4();
    const faqData = {
      id,
      question: sanitize(question),
      answer: sanitizeMultiline(answer),
      category: category || null,
      sort_order: sort_order !== undefined ? sort_order : 0,
      is_published: is_published !== undefined ? (is_published ? 1 : 0) : 1,
    };

    const faq = faqRepo.create(faqData);
    res.status(201).json({
      success: true,
      data: faq,
      message: 'FAQ created successfully',
    });
  } catch (err) {
    console.error('Create FAQ error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Update a FAQ
router.put('/:id', adminAuth, (req, res) => {
  try {
    const existing = faqRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    const updates = {};
    const allowedFields = ['question', 'answer', 'category', 'sort_order', 'is_published'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'question') updates[field] = sanitize(req.body[field]);
        else if (field === 'answer') updates[field] = sanitizeMultiline(req.body[field]);
        else if (field === 'is_published') {
          updates[field] = req.body[field] ? 1 : 0;
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const faq = faqRepo.update(req.params.id, updates);
    res.json({
      success: true,
      data: faq,
      message: 'FAQ updated successfully',
    });
  } catch (err) {
    console.error('Update FAQ error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: Delete a FAQ
router.delete('/:id', adminAuth, (req, res) => {
  try {
    const existing = faqRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    faqRepo.delete(req.params.id);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('Delete FAQ error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
