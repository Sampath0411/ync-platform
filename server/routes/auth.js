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
const { getFirestore, getDoc, getAuth, uploadFile } = require('../db/firebase');

const router = express.Router();

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

router.post('/register', registerRules, handleErrors, async (req, res) => {
  try {
    const { name, email, mobile, password, date_of_birth, gender, city, social_links } = req.body;
    const sanitizedName = sanitize(name);

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    if (mobile) {
      const existingMobile = await userRepo.findWhere({ mobile });
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
      social_links: social_links || {},
      role: 'user',
      is_active: 1,
      membership_status: 'trial',
      membership_trial_start: trialStart,
      membership_expiry: trialEnd,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await userRepo.create(userData);

    const token = jwt.sign(
      { id, email, name: sanitizedName, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const { password_hash: _, ...userWithoutPassword } = userData;

    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/login', loginRules, handleErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userRepo.findByEmail(email);
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
      data: { user: userData, token },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID token is required' });
    }

    // Verify Firebase ID token
    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
    }

    const { uid: firebase_uid, email, name: googleName, picture } = decoded;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required from Google account' });
    }

    // Check if user exists by firebase_uid
    let user = await userRepo.findWhere({ firebase_uid });
    if (user.length > 0) {
      user = user[0];
      // Update last login
      await userRepo.update(user.id, {
        updated_at: new Date().toISOString(),
        profile_photo: picture || user.profile_photo,
      });
    } else {
      // Check if user exists by email (link accounts)
      user = await userRepo.findByEmail(email);
      if (user) {
        // Link Firebase UID to existing account
        await userRepo.update(user.id, {
          firebase_uid,
          auth_provider: 'google',
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new user from Google data
        const id = uuidv4();
        const trialStart = new Date().toISOString();
        const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const userData = {
          id,
          name: googleName || email.split('@')[0],
          email,
          firebase_uid,
          auth_provider: 'google',
          password_hash: null,
          role: 'user',
          is_active: 1,
          membership_status: 'trial',
          membership_trial_start: trialStart,
          membership_expiry: trialEnd,
          profile_photo: picture || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await userRepo.create(userData);
        user = userData;
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      data: { user: userData, token },
      message: 'Google sign-in successful',
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
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

router.put('/profile', auth, profileRules, handleErrors, async (req, res) => {
  try {
    const { name, mobile, date_of_birth, gender, city, social_links } = req.body;
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

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
      if (new Date(date_of_birth) > new Date()) {
        return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future' });
      }
      updates.date_of_birth = date_of_birth;
    }
    if (gender !== undefined) updates.gender = gender;
    if (city !== undefined) updates.city = sanitize(city);
    if (social_links !== undefined) updates.social_links = social_links;

    const updated = await userRepo.update(req.user.id, updates);
    const { password_hash, ...userData } = updated;

    res.json({ success: true, data: userData, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/password', auth, passwordRules, handleErrors, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = bcrypt.compareSync(old_password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = bcrypt.hashSync(new_password, 10);
    await userRepo.update(req.user.id, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', forgotPasswordRules, handleErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with that email, reset instructions will be sent.' });
    }

    console.log(`Password reset requested for: ${email}`);

    res.json({ success: true, message: 'If an account exists with that email, reset instructions will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const uploaded = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'profile-photos'
    );

    await userRepo.update(req.user.id, {
      profile_photo: uploaded.url,
      profile_photo_path: uploaded.path,
      updated_at: new Date().toISOString(),
    });

    res.json({ success: true, data: { profile_photo: uploaded.url }, message: 'Profile photo updated' });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Firebase/Google auth users don't have a password — skip password check
    if (user.auth_provider !== 'google') {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to delete account' });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Password is incorrect' });
      }
    }

    const db = getFirestore();
    const userId = req.user.id;

    // Delete related records from Firestore
    const collectionsToClean = ['tickets', 'bookings', 'memberships', 'notifications', 'favorites', 'waitlist', 'reviews'];
    for (const coll of collectionsToClean) {
      const snapshot = await db.collection(coll).where('user_id', '==', userId).get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Delete user
    await db.collection('users').doc(userId).delete();

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/export', auth, async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const db = getFirestore();
    const userId = req.user.id;

    const [bookingsSnap, ticketsSnap, membershipsSnap, notificationsSnap, reviewsSnap] = await Promise.all([
      db.collection('bookings').where('user_id', '==', userId).orderBy('created_at', 'desc').get(),
      db.collection('tickets').where('user_id', '==', userId).get(),
      db.collection('memberships').where('user_id', '==', userId).get(),
      db.collection('notifications').where('user_id', '==', userId).get(),
      db.collection('reviews').where('user_id', '==', userId).get(),
    ]);

    const bookings = [];
    bookingsSnap.forEach(doc => bookings.push({ id: doc.id, ...doc.data() }));
    const tickets = [];
    ticketsSnap.forEach(doc => tickets.push({ id: doc.id, ...doc.data() }));
    const memberships = [];
    membershipsSnap.forEach(doc => memberships.push({ id: doc.id, ...doc.data() }));
    const notifications = [];
    notificationsSnap.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
    const reviews = [];
    reviewsSnap.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));

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
