const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getFirestore, getDoc } = require('./firebase');

async function seedDefaultAdmin() {
  const db = getFirestore();
  const existing = await getDoc('admin_users', 'admin@ync.com');
  if (existing) return;

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync('admin123', 10);

  await db.collection('admin_users').doc(id).set({
    id,
    name: 'Super Admin',
    email: 'admin@ync.com',
    password_hash: passwordHash,
    role: 'super_admin',
    created_at: new Date().toISOString(),
  });

  console.log('Default admin seeded: admin@ync.com / admin123');
}

async function seedInitialSettings() {
  const db = getFirestore();
  const existing = await getDoc('settings', 'app_settings');
  if (existing) return;

  await db.collection('settings').doc('app_settings').set({
    site_name: 'YNC Platform',
    site_description: 'Your Next Community — Events & Engagement Platform',
    contact_email: 'admin@ync.com',
    enable_registration: true,
    enable_membership: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log('Default settings seeded.');
}

async function seedAll() {
  await seedDefaultAdmin();
  await seedInitialSettings();
  console.log('Firestore seeding complete.');
}

module.exports = { seedAll, seedDefaultAdmin, seedInitialSettings };
