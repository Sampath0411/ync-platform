const { initializeApp, applicationDefault, cert, getApps } = require('firebase-admin/app');
const { getFirestore: getFs } = require('firebase-admin/firestore');
const { getAuth: getAuthModule } = require('firebase-admin/auth');
const path = require('path');

let firestore = null;
let authInstance = null;
let initialized = false;

function getFirestore() {
  if (firestore) return firestore;
  initFirebase();
  return firestore;
}

function getAuth() {
  if (authInstance) return authInstance;
  initFirebase();
  return authInstance;
}

function initFirebase() {
  if (initialized) return;

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeApp({
        credential: applicationDefault(),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      const keyPath = path.resolve(__dirname, '../config/firebase-key.json');
      initializeApp({
        credential: cert(keyPath),
      });
    }

    firestore = getFs();
    firestore.settings({ ignoreUndefinedProperties: true });
    authInstance = getAuthModule();
    initialized = true;
    console.log('Firebase initialized successfully');
  } catch (err) {
    console.error('Firebase initialization error:', err.message);
    throw err;
  }
}

function snapshotToArray(snapshot) {
  const items = [];
  snapshot.forEach(doc => {
    items.push({ id: doc.id, ...doc.data() });
  });
  return items;
}

async function getDoc(collection, id) {
  const db = getFirestore();
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

module.exports = { getFirestore, getAuth, snapshotToArray, getDoc };
