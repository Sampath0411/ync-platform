/**
 * Centralized validation and sanitization utilities for YNC server.
 * All route files should import from here for consistent validation.
 */

const sanitizeHtml = require('sanitize-html');

/**
 * Sanitize a string input — strip HTML tags and trim whitespace.
 * Returns null for non-strings.
 */
function sanitize(val) {
  if (typeof val !== 'string') return val;
  return sanitizeHtml(val.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Strip HTML tags but keep line breaks (for multi-line content).
 */
function sanitizeMultiline(val) {
  if (typeof val !== 'string') return val;
  return sanitizeHtml(val.trim(), {
    allowedTags: [],
    allowedAttributes: {},
    allowedSchemes: [],
  });
}

/**
 * Validate email format.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate Indian mobile number (10 digits, optionally with +91 prefix).
 */
function isValidMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return false;
  const cleaned = mobile.replace(/\s+/g, '').replace(/^(\+91|91)/, '');
  return /^\d{10}$/.test(cleaned);
}

/**
 * Validate password strength.
 * Returns { valid: boolean, message?: string }
 */
function validatePassword(password, minLength = 8) {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }
  return { valid: true };
}

/**
 * Validate a date string is a valid date and optionally not in the past.
 */
function isValidDate(dateStr, allowPast = true) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  if (!allowPast && date < new Date(new Date().toDateString())) return false;
  return true;
}

/**
 * Validate numeric value is within a range.
 */
function isValidNumber(val, min = 0, max = Infinity) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || typeof num !== 'number') return false;
  return num >= min && num <= max;
}

/**
 * Validate integer is within a range.
 */
function isValidInteger(val, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = typeof val === 'string' ? parseInt(val, 10) : val;
  if (!Number.isInteger(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate a string length is within bounds.
 */
function isValidLength(val, min = 1, max = 1000) {
  if (!val || typeof val !== 'string') return false;
  const len = val.trim().length;
  return len >= min && len <= max;
}

/**
 * Validate UUID format.
 */
function isValidUUID(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Validate URL format.
 */
function isValidURL(val) {
  if (!val || typeof val !== 'string') return false;
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate event status enum value.
 */
const VALID_EVENT_STATUSES = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'];
function isValidEventStatus(val) {
  return VALID_EVENT_STATUSES.includes(val);
}

/**
 * Validate event category.
 */
const VALID_EVENT_CATEGORIES = [
  'workshop', 'seminar', 'hackathon', 'meetup', 'conference',
  'webinar', 'competition', 'social', 'cultural', 'sports', 'other',
];
function isValidEventCategory(val) {
  return VALID_EVENT_CATEGORIES.includes(val);
}

/**
 * Validate notification type.
 */
const VALID_NOTIFICATION_TYPES = [
  'event_reminder', 'membership_approval', 'membership_rejection',
  'event_cancellation', 'event_update', 'community_news', 'general',
];
function isValidNotificationType(val) {
  return VALID_NOTIFICATION_TYPES.includes(val);
}

/**
 * Validate membership status.
 */
const VALID_MEMBERSHIP_STATUSES = ['pending', 'approved', 'rejected', 'returned'];
function isValidMembershipStatus(val) {
  return VALID_MEMBERSHIP_STATUSES.includes(val);
}

/**
 * Validate announcement type.
 */
const VALID_ANNOUNCEMENT_TYPES = ['news', 'update', 'volunteer', 'notice'];
function isValidAnnouncementType(val) {
  return VALID_ANNOUNCEMENT_TYPES.includes(val);
}

/**
 * Validate announcement priority.
 */
const VALID_PRIORITIES = ['low', 'medium', 'high'];
function isValidPriority(val) {
  return VALID_PRIORITIES.includes(val);
}

/**
 * Validate booking status.
 */
const VALID_BOOKING_STATUSES = ['confirmed', 'cancelled', 'pending', 'refunded'];
function isValidBookingStatus(val) {
  return VALID_BOOKING_STATUSES.includes(val);
}

/**
 * Validate ticket status.
 */
const VALID_TICKET_STATUSES = ['active', 'used', 'expired', 'cancelled'];
function isValidTicketStatus(val) {
  return VALID_TICKET_STATUSES.includes(val);
}

/**
 * Express middleware factory: validates required fields exist in req.body.
 * Returns 400 with message if any are missing.
 */
function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const val = req.body[f];
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missing.join(', ')} required`,
      });
    }
    next();
  };
}

/**
 * Express middleware factory: sanitize all string fields in req.body.
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    }
  }
  next();
}

/**
 * Express middleware factory: sanitize query params.
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    }
  }
  next();
}

module.exports = {
  sanitize,
  sanitizeMultiline,
  sanitizeBody,
  sanitizeQuery,
  isValidEmail,
  isValidMobile,
  validatePassword,
  isValidDate,
  isValidNumber,
  isValidInteger,
  isValidLength,
  isValidUUID,
  isValidURL,
  isValidEventStatus,
  isValidEventCategory,
  isValidNotificationType,
  isValidMembershipStatus,
  isValidAnnouncementType,
  isValidPriority,
  isValidBookingStatus,
  isValidTicketStatus,
  requireFields,
  VALID_EVENT_STATUSES,
  VALID_EVENT_CATEGORIES,
  VALID_NOTIFICATION_TYPES,
  VALID_MEMBERSHIP_STATUSES,
  VALID_ANNOUNCEMENT_TYPES,
  VALID_PRIORITIES,
  VALID_BOOKING_STATUSES,
  VALID_TICKET_STATUSES,
};
