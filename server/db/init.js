const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const config = require('../config/default');

let db = null;

function getDb() {
  if (db) return db;

  const dbDir = path.dirname(config.DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initTables();
  seedDefaultAdmin();

  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT,
      password_hash TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      city TEXT,
      profile_photo TEXT,
      social_links TEXT DEFAULT '{}',
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      membership_status TEXT DEFAULT 'none',
      membership_trial_start TEXT,
      membership_expiry TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      gallery_images TEXT DEFAULT '[]',
      event_date TEXT,
      start_time TEXT,
      end_time TEXT,
      venue TEXT,
      google_maps_link TEXT,
      organizer_name TEXT,
      category TEXT,
      max_capacity INTEGER DEFAULT 0,
      available_seats INTEGER DEFAULT 0,
      registration_deadline TEXT,
      rules TEXT,
      highlights TEXT DEFAULT '[]',
      contact_info TEXT DEFAULT '{}',
      price REAL DEFAULT 0,
      member_discount REAL DEFAULT 0,
      non_member_price REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_amount REAL DEFAULT 0,
      booking_date TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      ticket_number TEXT UNIQUE NOT NULL,
      qr_code_data TEXT,
      barcode_data TEXT,
      status TEXT DEFAULT 'active',
      validated_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      request_date TEXT DEFAULT (datetime('now')),
      reason TEXT,
      identification_url TEXT,
      status TEXT DEFAULT 'pending',
      reviewed_by TEXT,
      reviewed_at TEXT,
      membership_id TEXT UNIQUE,
      expiry_date TEXT,
      qr_code_data TEXT,
      benefits TEXT DEFAULT '[]',
      admin_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT DEFAULT 'general',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      is_global INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'news',
      priority TEXT DEFAULT 'medium',
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'image',
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      title TEXT,
      description TEXT,
      uploaded_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_url TEXT,
      website_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_validations (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      validator_id TEXT,
      action TEXT DEFAULT 'validated',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_membership_status ON users(membership_status);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
    CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);

    -- ===== NEW FEATURE TABLES =====

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'waiting',
      created_at TEXT DEFAULT (datetime('now')),
      notified_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      booking_id TEXT,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      UNIQUE(user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS feedback_forms (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      questions TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback_responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      answers TEXT DEFAULT '[]',
      submitted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(form_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS short_urls (
      code TEXT PRIMARY KEY,
      target_url TEXT NOT NULL,
      type TEXT DEFAULT 'ticket',
      reference_id TEXT,
      click_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      keys TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_event ON favorites(event_id);
    CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_waitlist_event ON waitlist(event_id);
    CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_forms_event ON feedback_forms(event_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_responses_form ON feedback_responses(form_id);
    CREATE INDEX IF NOT EXISTS idx_short_urls_type ON short_urls(type);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
  `);
}

function seedDefaultAdmin() {
  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get('admin@ync.com');
  if (existing) return;

  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  const passwordHash = bcrypt.hashSync('admin123', 10);

  db.prepare(`
    INSERT INTO admin_users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, 'Super Admin', 'admin@ync.com', passwordHash, 'super_admin');

  console.log('Default admin seeded: admin@ync.com / admin123');
}

module.exports = { getDb };
