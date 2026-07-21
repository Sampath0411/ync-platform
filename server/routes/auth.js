const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/default');
const userRepo = require('../repositories/userRepo');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const {
  sanitize,
  sanitizeBody,
  isValidEmail,
  isValidMobile,
  validatePassword,
  isValidDate,
  isValidLength,
} = require('../utils/validation');

const router = express.Router();

// ---- Validation rules ----

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  body('mobile').optional({ values: 'falsy' }).trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('date_of_birth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  body('gender').optional({ values: 'falsy' }).trim().isIn(['male', 'female', 'other', 'non-binary', 'prefer-not-to-say']).withMessage('Invalid gender value'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('City too long'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const profileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('mobile').optional({ values: 'falsy' }).trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('city').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('City too long'),
  body('date_of_birth').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  body('gender').optional({ values: 'falsy' }).trim().isIn(['male', 'female', 'other', 'non-binary', 'prefer-not-to-say']).withMessage('Invalid gender value'),
];

const passwordRules = [
  body('old_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8, max: 128 }).withMessage('New password must be 8-128 characters')
    .custom((val, { req }) => {
      if (val === req.body.old_password) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
];

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

router.post('/register', registerRules, handleErrors, async (req, res) => {
  try {
    const { name, email, mobile, password, date_of_birth, gender, city, social_links } = req.body;

    // Sanitize name
    const sanitizedName = sanitize(name);

    const existing = userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Check mobile uniqueness
    if (mobile) {
      const existingMobile = userRepo.findWhere({ mobile });
      if (existingMobile.length > 0) {
        return res.status(409).json({ success: false, message: 'Mobile number already registered' });
      }
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const userData = {
      id,
      name: sanitizedName,
      email,
      mobile: mobile || null,
      password_hash: passwordHash,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      city: city || null,
      social_links: social_links ? JSON.stringify(social_links) : '{}',
      membership_status: 'trial',
      membership_trial_start: trialStart,
      membership_expiry: trialEnd,
    };

    userRepo.create(userData);

    const token = jwt.sign(
      { id, email, name: sanitizedName, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const { password_hash, ...userWithoutPassword } = userData;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/login', loginRules, handleErrors, (req, res) => {
  try {
    const { email, password } = req.body;

    const user = userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      data: {
        user: userData,
        token,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password_hash, ...userData } = user;
    res.json({ success: true, data: userData });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/profile', auth, profileRules, handleErrors, (req, res) => {
  try {
    const { name, mobile, date_of_birth, gender, city, social_links } = req.body;
    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Server-side business logic validations
    if (name !== undefined && name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = sanitize(name);
    if (mobile !== undefined) updates.mobile = mobile;
    if (date_of_birth !== undefined) {
      if (!isValidDate(date_of_birth)) {
        return res.status(400).json({ success: false, message: 'Invalid date of birth' });
      }
      // Check not a future date
      if (new Date(date_of_birth) > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future' });
      }
      updates.date_of_birth = date_of_birth;
    }
    if (gender !== undefined) updates.gender = gender;
    if (city !== undefined) updates.city = sanitize(city);
    if (social_links !== undefined) updates.social_links = JSON.stringify(social_links);

    const updated = userRepo.update(req.user.id, updates);
    const { password_hash, ...userData } = updated;

    res.json({ success: true, data: userData, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/password', auth, passwordRules, handleErrors, (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = bcrypt.compareSync(old_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = bcrypt.hashSync(new_password, 10);
    userRepo.update(req.user.id, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', forgotPasswordRules, handleErrors, (req, res) => {
  try {
    const { email } = req.body;

    const user = userRepo.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with that email, reset instructions will be sent.' });
    }

    // In production, this would send an actual email with a reset token
    // TODO: Generate reset token, store in DB, send email
    console.log(`Password reset requested for: ${email}`);

    res.json({ success: true, message: 'If an account exists with that email, reset instructions will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upload profile photo
router.put('/photo', auth, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    userRepo.update(req.user.id, {
      profile_photo: photoUrl,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: { profile_photo: photoUrl }, message: 'Profile photo updated' });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete account
router.delete('/account', auth, (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }

    const user = userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Password is incorrect' });
    }

    const db = require('../db/init').getDb();

    // Delete all related records in a transaction
    const deleteTransaction = db.transaction(() => {
      db.prepare('DELETE FROM tickets WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM bookings WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM memberships WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    });

    deleteTransaction();

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// User data export
router.get('/export', auth, (req, res) => {
  try {
    const db = require('../db/init').getDb();
    const user = userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const bookings = db.prepare(
      `SELECT b.*, e.name as event_name, e.event_date, e.venue FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.user_id = ?`
    ).all(req.user.id);

    const tickets = db.prepare(
      'SELECT * FROM tickets WHERE user_id = ?'
    ).all(req.user.id);

    const memberships = db.prepare(
      'SELECT * FROM memberships WHERE user_id = ?'
    ).all(req.user.id);

    const notifications = db.prepare(
      'SELECT id, type, title, message, is_read, created_at FROM notifications WHERE user_id = ?'
    ).all(req.user.id);

    const reviews = db.prepare(
      'SELECT * FROM reviews WHERE user_id = ?'
    ).all(req.user.id);

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        exported_at: new Date().toISOString(),
        user: safeUser,
        bookings,
        tickets,
        memberships,
        notifications,
        reviews,
      },
    });
  } catch (err) {
    console.error('Export data error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
