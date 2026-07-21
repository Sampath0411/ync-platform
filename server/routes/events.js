const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const eventRepo = require('../repositories/eventRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { sanitize, sanitizeMultiline } = require('../utils/validation');
const { getDb } = require('../db/init');

const router = express.Router();

// ---- Validation rules ----
const eventRules = [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Event name must be 2-200 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }).withMessage('Description too long (max 5000)'),
  body('event_date').notEmpty().withMessage('Event date is required').isISO8601().withMessage('Invalid event date format'),
  body('start_time').optional({ values: 'falsy' }).trim(),
  body('end_time').optional({ values: 'falsy' }).trim(),
  body('venue').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Venue too long'),
  body('organizer_name').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Organizer name too long'),
  body('category').optional({ values: 'falsy' }).trim(),
  body('max_capacity').optional().isInt({ min: 0 }).withMessage('Capacity must be 0 or more'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('member_discount').optional().isFloat({ min: 0 }).withMessage('Member discount must be 0 or more'),
  body('non_member_price').optional().isFloat({ min: 0 }).withMessage('Non-member price must be 0 or more'),
  body('registration_deadline').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid registration deadline format'),
  body('status').optional().trim().isIn(['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']).withMessage('Invalid event status'),
  body('rules').optional({ values: 'falsy' }).trim().isLength({ max: 5000 }).withMessage('Rules too long'),
];

const eventUpdateRules = eventRules.map(rule => {
  // Make all fields optional for updates
  if (rule.builder) {
    // Keep the same rules but allow optional
  }
  return rule;
});

// ---- Validation result handler ----
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

// ---- Routes ----

router.get('/', (req, res) => {
  try {
    const {
      status,
      category,
      search,
      date_from,
      date_to,
      page = 1,
      limit = 20,
      sort_by = 'event_date',
      sort_order = 'DESC',
    } = req.query;

    let conditions = [];
    let params = [];

    if (status) {
      const statuses = status.split(',');
      const placeholders = statuses.map(() => '?').join(',');
      conditions.push(`status IN (${placeholders})`);
      params.push(...statuses);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR venue LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (date_from) {
      conditions.push('event_date >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('event_date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '';
    const allowedSort = ['event_date', 'created_at', 'name', 'price'];
    const sort = allowedSort.includes(sort_by) ? sort_by : 'event_date';
    const order = sort_order === 'ASC' ? 'ASC' : 'DESC';

    const db = require('../db/init').getDb();
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = whereClause ? `WHERE ${whereClause}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM events ${where}`)
      .get(...params);
    const total = countRow ? countRow.total : 0;
    const rows = db
      .prepare(`SELECT * FROM events ${where} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`)
      .all(...params, parseInt(limit, 10), offset);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const event = eventRepo.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', adminAuth, eventRules, handleErrors, (req, res) => {
  try {
    const {
      name,
      description,
      cover_image,
      gallery_images,
      event_date,
      start_time,
      end_time,
      venue,
      google_maps_link,
      organizer_name,
      category,
      max_capacity,
      registration_deadline,
      rules,
      highlights,
      contact_info,
      price,
      member_discount,
      non_member_price,
      status,
    } = req.body;

    const id = uuidv4();

    // Sanitize text fields
    const sanitizedDescription = description ? sanitizeMultiline(description) : null;
    const sanitizedVenue = venue ? sanitize(venue) : null;
    const sanitizedOrg = organizer_name ? sanitize(organizer_name) : null;
    const sanitizedRules = rules ? sanitizeMultiline(rules) : null;

    const eventData = {
      id,
      name: sanitize(name),
      description: sanitizedDescription,
      cover_image: cover_image || null,
      gallery_images: gallery_images ? JSON.stringify(gallery_images) : '[]',
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      venue: sanitizedVenue,
      google_maps_link: google_maps_link || null,
      organizer_name: sanitizedOrg,
      category: category || null,
      max_capacity: max_capacity != null ? parseInt(max_capacity, 10) : 0,
      available_seats: max_capacity != null ? parseInt(max_capacity, 10) : 0,
      registration_deadline: registration_deadline || null,
      rules: sanitizedRules,
      highlights: highlights ? JSON.stringify(highlights) : '[]',
      contact_info: contact_info ? JSON.stringify(contact_info) : '{}',
      price: price != null ? parseFloat(price) : 0,
      member_discount: member_discount != null ? parseFloat(member_discount) : 0,
      non_member_price: non_member_price != null ? parseFloat(non_member_price) : 0,
      status: status || 'draft',
    };

    const event = eventRepo.create(eventData);
    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, (req, res) => {
  try {
    const existing = eventRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const allowedFields = [
      'name', 'description', 'cover_image', 'gallery_images', 'event_date',
      'start_time', 'end_time', 'venue', 'google_maps_link', 'organizer_name',
      'category', 'max_capacity', 'registration_deadline', 'rules', 'highlights',
      'contact_info', 'price', 'member_discount', 'non_member_price', 'status',
    ];

    const updates = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Sanitize text fields
        if (field === 'name') updates[field] = sanitize(req.body[field]);
        else if (field === 'description' || field === 'rules') updates[field] = sanitizeMultiline(req.body[field]);
        else if (field === 'venue' || field === 'organizer_name') updates[field] = sanitize(req.body[field]);
        else if (field === 'gallery_images' || field === 'highlights' || field === 'contact_info') {
          updates[field] = JSON.stringify(req.body[field]);
        } else if (field === 'max_capacity' && req.body[field] < existing.max_capacity) {
          // Validate capacity reduction doesn't go below confirmed bookings
          const db = getDb();
          const bookedCount = db.prepare(
            "SELECT COALESCE(SUM(quantity), 0) as total FROM bookings WHERE event_id = ? AND status = 'confirmed'"
          ).get(req.params.id).total;

          if (req.body.max_capacity < bookedCount) {
            return res.status(400).json({
              success: false,
              message: `Cannot reduce capacity below ${bookedCount} (${bookedCount} already booked)`,
            });
          }
          updates.max_capacity = req.body.max_capacity;
          updates.available_seats = req.body.max_capacity - bookedCount;
        } else if (field === 'max_capacity') {
          const diff = req.body.max_capacity - existing.max_capacity;
          updates.max_capacity = req.body.max_capacity;
          updates.available_seats = Math.max(0, existing.available_seats + diff);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const event = eventRepo.update(req.params.id, updates);
    res.json({ success: true, data: event, message: 'Event updated successfully' });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', adminAuth, (req, res) => {
  try {
    const existing = eventRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check no active bookings
    const db = getDb();
    const activeBookings = db.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE event_id = ? AND status = 'confirmed'"
    ).get(req.params.id);
    if (activeBookings.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete event with ${activeBookings.count} active booking(s). Cancel bookings first.`,
      });
    }

    eventRepo.delete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
