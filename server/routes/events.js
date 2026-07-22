const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const eventRepo = require('../repositories/eventRepo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { sanitize, sanitizeMultiline } = require('../utils/validation');
const { getFirestore, getDoc, snapshotToArray } = require('../db/firebase');

const router = express.Router();

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
    const {
      status,
      category,
      search,
      date_from,
      date_to,
      page = 1,
      limit = 20,
      sort_by = 'event_date',
      sort_order = 'desc',
    } = req.query;

    const db = getFirestore();
    let query = db.collection('events');
    const filters = [];

    if (status) {
      const statuses = status.split(',');
      // Firestore 'in' supports up to 10 values
      if (statuses.length <= 10) {
        query = query.where('status', 'in', statuses);
        filters.push('status');
      }
    }

    if (category) {
      query = query.where('category', '==', category);
      filters.push('category');
    }

    const allowedSort = ['event_date', 'created_at', 'name', 'price'];
    const sort = allowedSort.includes(sort_by) ? sort_by : 'event_date';
    const order = sort_order === 'ASC' || sort_order === 'asc' ? 'asc' : 'desc';

    // Date range filtering — do client-side for flexibility
    let snapshot = await query.orderBy(sort, order).get();
    let results = snapshotToArray(snapshot);

    // Apply client-side filters that Firestore can't do natively
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(e =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }

    if (date_from) {
      results = results.filter(e => e.event_date >= date_from);
    }

    if (date_to) {
      results = results.filter(e => e.event_date <= date_to);
    }

    // Paginate
    const total = results.length;
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;
    const data = results.slice(offset, offset + l);

    // Parse stored JSON fields for response
    const parsed = data.map(e => ({
      ...e,
      gallery_images: typeof e.gallery_images === 'string' ? JSON.parse(e.gallery_images) : e.gallery_images,
      highlights: typeof e.highlights === 'string' ? JSON.parse(e.highlights) : e.highlights,
      contact_info: typeof e.contact_info === 'string' ? JSON.parse(e.contact_info) : e.contact_info,
    }));

    res.json({
      success: true,
      data: parsed,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await eventRepo.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    // Parse JSON fields
    const parsed = {
      ...event,
      gallery_images: typeof event.gallery_images === 'string' ? JSON.parse(event.gallery_images) : event.gallery_images,
      highlights: typeof event.highlights === 'string' ? JSON.parse(event.highlights) : event.highlights,
      contact_info: typeof event.contact_info === 'string' ? JSON.parse(event.contact_info) : event.contact_info,
    };
    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', adminAuth, eventRules, handleErrors, async (req, res) => {
  try {
    const {
      name, description, cover_image, gallery_images, event_date,
      start_time, end_time, venue, google_maps_link, organizer_name,
      category, max_capacity, registration_deadline, rules, highlights,
      contact_info, price, member_discount, non_member_price, status,
    } = req.body;

    const id = uuidv4();

    const eventData = {
      id,
      name: sanitize(name),
      description: description ? sanitizeMultiline(description) : null,
      cover_image: cover_image || null,
      gallery_images: gallery_images || [],
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      venue: venue ? sanitize(venue) : null,
      google_maps_link: google_maps_link || null,
      organizer_name: organizer_name ? sanitize(organizer_name) : null,
      category: category || null,
      max_capacity: max_capacity != null ? parseInt(max_capacity, 10) : 0,
      available_seats: max_capacity != null ? parseInt(max_capacity, 10) : 0,
      registration_deadline: registration_deadline || null,
      rules: rules ? sanitizeMultiline(rules) : null,
      highlights: highlights || [],
      contact_info: contact_info || {},
      price: price != null ? parseFloat(price) : 0,
      member_discount: member_discount != null ? parseFloat(member_discount) : 0,
      non_member_price: non_member_price != null ? parseFloat(non_member_price) : 0,
      status: status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const event = await eventRepo.create(eventData);
    res.status(201).json({ success: true, data: event, message: 'Event created successfully' });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const existing = await eventRepo.findById(req.params.id);
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
        if (field === 'name') updates[field] = sanitize(req.body[field]);
        else if (field === 'description' || field === 'rules') updates[field] = sanitizeMultiline(req.body[field]);
        else if (field === 'venue' || field === 'organizer_name') updates[field] = sanitize(req.body[field]);
        else if (field === 'gallery_images' || field === 'highlights') updates[field] = req.body[field];
        else if (field === 'contact_info') updates[field] = req.body[field];
        else if (field === 'max_capacity' && req.body[field] < existing.max_capacity) {
          const db = getFirestore();
          const bookingsSnap = await db.collection('bookings')
            .where('event_id', '==', req.params.id)
            .where('status', '==', 'confirmed')
            .get();

          let bookedCount = 0;
          bookingsSnap.forEach(doc => { bookedCount += (doc.data().quantity || 0); });

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

    const event = await eventRepo.update(req.params.id, updates);
    res.json({ success: true, data: event, message: 'Event updated successfully' });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const existing = await eventRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check no active bookings
    const db = getFirestore();
    const bookingsSnap = await db.collection('bookings')
      .where('event_id', '==', req.params.id)
      .where('status', '==', 'confirmed')
      .get();

    if (bookingsSnap.size > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete event with ${bookingsSnap.size} active booking(s). Cancel bookings first.`,
      });
    }

    await eventRepo.delete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
