const { getFirestore, getAuth, snapshotToArray, getDoc } = require('./firebase');
const { seedAll } = require('./seed');

let initialized = false;

async function getDb() {
  const db = getFirestore();
  if (!initialized) {
    initialized = true;
    try {
      await seedAll();
    } catch (err) {
      console.error('Seed error (non-fatal):', err.message);
    }
  }
  return db;
}

module.exports = { getDb, getFirestore, getAuth, snapshotToArray, getDoc };
