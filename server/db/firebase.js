const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore: getFs } = require('firebase-admin/firestore');
const { getAuth: getAuthModule } = require('firebase-admin/auth');
const { getStorage: getStorageModule } = require('firebase-admin/storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

let firestore = null;
let authInstance = null;
let storageInstance = null;
let storageBucket = null;
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

function getStorage() {
  if (storageInstance) return storageInstance;
  initFirebase();
  return storageInstance;
}

function getBucket() {
  if (storageBucket) return storageBucket;
  initFirebase();
  return storageBucket;
}

function initFirebase() {
  if (initialized) return;
  // Mark as attempted so we don't retry on every request after a permanent failure
  initialized = true;

  try {
    let appConfig;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      appConfig = {
        credential: applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      };
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (parseErr) {
        throw new Error(`FIREBASE_SERVICE_ACCOUNT JSON parse failed: ${parseErr.message}`);
      }
      appConfig = {
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`,
      };
    } else {
      const keyPath = path.resolve(__dirname, '../config/firebase-key.json');
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const serviceAccount = require(keyPath);
      appConfig = {
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`,
      };
    }

    initializeApp(appConfig);

    firestore = getFs();
    firestore.settings({ ignoreUndefinedProperties: true });
    authInstance = getAuthModule();
    storageInstance = getStorageModule();
    storageBucket = storageInstance.bucket();
    console.log('Firebase initialized successfully');
  } catch (err) {
    const errMsg = err.message;
    console.error('Firebase initialization error:', errMsg);

    function stubError() {
      throw new Error(`Firebase not initialized: ${errMsg}`);
    }
    // Error stubs so callers get a clear message instead of crashing
    firestore = { collection: stubError, batch: stubError };
    authInstance = { verifyIdToken: stubError, getUser: stubError };
    storageInstance = { bucket: stubError };
    storageBucket = { file: stubError, name: 'unknown' };
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

async function uploadFile(buffer, originalName, mimeType, folder = 'uploads') {
  const bucket = getBucket();
  const ext = path.extname(originalName || '').toLowerCase();
  const filename = `${folder}/${uuidv4()}${ext}`;
  const token = uuidv4();
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000',
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false,
  });

  return {
    path: filename,
    url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${token}`,
  };
}

async function deleteFile(filePathOrUrl) {
  if (!filePathOrUrl) return;
  const bucket = getBucket();
  let filePath = filePathOrUrl;

  if (filePathOrUrl.includes('/')) {
    const storageMarker = `/v0/b/${bucket.name}/o/`;
    const publicMarker = `/${bucket.name}/`;
    if (filePathOrUrl.includes(storageMarker)) {
      filePath = decodeURIComponent(filePathOrUrl.split(storageMarker)[1].split('?')[0]);
    } else if (filePathOrUrl.includes(publicMarker)) {
      filePath = decodeURIComponent(filePathOrUrl.split(publicMarker)[1].split('?')[0]);
    } else if (filePathOrUrl.startsWith('/uploads/')) {
      filePath = filePathOrUrl.replace(/^\//, '');
    }
  }

  try {
    await bucket.file(filePath).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn('Firebase Storage delete warning:', err.message);
  }
}

module.exports = {
  getFirestore,
  getAuth,
  getStorage,
  getBucket,
  uploadFile,
  deleteFile,
  snapshotToArray,
  getDoc,
};
