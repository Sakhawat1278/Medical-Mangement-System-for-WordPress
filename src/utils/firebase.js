import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, collection, doc, getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, writeBatch, increment
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';

// ─── Firebase Initialization ─────────────────────────────────────────────────
// Config is injected from WordPress via window.ecareConfig.firebaseConfig
// Set during the onboarding wizard and stored in WP options

let _app = null;
let _db = null;
let _storage = null;
let _auth = null;

export function initFirebase(config) {
  if (!config || !config.projectId) return null;
  try {
    _app = getApps().length ? getApp() : initializeApp(config);
    _db = getFirestore(_app);
    _storage = getStorage(_app);
    _auth = getAuth(_app);
    return { app: _app, db: _db, storage: _storage, auth: _auth };
  } catch (e) {
    console.warn('[E-CARE] Firebase init failed:', e.message);
    return null;
  }
}

// Auto-initialize from ecareConfig if available on load
const cfg = window?.ecareConfig?.firebaseConfig || window?.ecareAuthConfig?.firebaseConfig;
if (cfg && cfg.projectId) {
  initFirebase(cfg);
}

export const getDb = () => _db;
export const getStorageBucket = () => _storage;
export const getFirebaseAuth = () => _auth;
export { GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier };

// ─── Collection Names ────────────────────────────────────────────────────────
export const COLLECTIONS = {
  patients:              'ecare_patients',
  staff:                 'ecare_staff',
  specialities:          'ecare_specialities',
  services:              'ecare_services',
  appointments:          'ecare_appointments',
  careProviders:         'ecare_care_providers',
  ambulance:             'ecare_ambulance',
  careProviderBookings:  'ecare_care_provider_bookings',
  billing:               'ecare_billing',
  ambulanceBookings:     'ecare_ambulance_bookings',
  notifications:         'ecare_notifications',
  refunds:               'ecare_refunds',
  manualVerifications:   'ecare_manual_verifications',
  medicalVault:          'ecare_medical_vault',
  payouts:               'ecare_payouts',
  doctorAvailability:    'ecare_doctor_availability',
  consultationNotes:     'ecare_consultation_notes',
  patientVitals:         'ecare_patient_vitals',
  labTests:              'ecare_lab_tests',
  labOrders:             'ecare_lab_orders',
  labLocations:          'ecare_lab_locations',
  staffAttendance:       'ecare_staff_attendance',
  supportTickets:        'ecare_support_tickets',
  supportMessages:       'ecare_support_messages',
  telemedRooms:          'ecare_telemed_rooms',
  telemedMessages:       'ecare_telemed_messages',
  promoCodes:            'ecare_promo_codes',
};

// ─── Generic CRUD Helpers ────────────────────────────────────────────────────

/** Fetch all documents from a Firestore collection as an array with id included */
export async function fbGetAll(collectionName) {
  if (!_db) return [];
  try {
    const snap = await getDocs(collection(_db, collectionName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn(`[Firebase] getAll(${collectionName}) failed:`, e.message);
    return [];
  }
}

/** Fetch documents matching a field value */
export async function fbGetWhere(collectionName, field, value) {
  if (!_db) return [];
  try {
    const q = query(collection(_db, collectionName), where(field, '==', value));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn(`[Firebase] getWhere(${collectionName}) failed:`, e.message);
    return [];
  }
}

/** Get a single document by Firestore ID */
export async function fbGetOne(collectionName, id) {
  if (!_db) return null;
  try {
    const snap = await getDoc(doc(_db, collectionName, String(id)));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn(`[Firebase] getOne(${collectionName}, ${id}) failed:`, e.message);
    return null;
  }
}

/** Add a new document (auto-generates Firestore ID) */
export async function fbAdd(collectionName, data) {
  if (!_db) throw new Error('Firebase not initialized');
  const payload = { ...data, created_at: serverTimestamp(), updated_at: serverTimestamp() };
  const ref = await addDoc(collection(_db, collectionName), payload);
  return { id: ref.id, ...data };
}

/** Set/overwrite a document with a specific ID */
export async function fbSet(collectionName, id, data) {
  if (!_db) throw new Error('Firebase not initialized');
  const payload = { ...data, updated_at: serverTimestamp() };
  await setDoc(doc(_db, collectionName, String(id)), payload, { merge: true });
  return { id, ...data };
}

/** Update specific fields of a document */
export async function fbUpdate(collectionName, id, data) {
  if (!_db) throw new Error('Firebase not initialized');
  const payload = { ...data, updated_at: serverTimestamp() };
  await updateDoc(doc(_db, collectionName, String(id)), payload);
  return { id, ...data };
}

/** Delete a document by ID */
export async function fbDelete(collectionName, id) {
  if (!_db) throw new Error('Firebase not initialized');
  await deleteDoc(doc(_db, collectionName, String(id)));
  return id;
}

/** Listen to a collection in real-time */
export function fbListen(collectionName, callback, errorCallback) {
  if (!_db) return () => {};
  return onSnapshot(
    collection(_db, collectionName),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => { if (errorCallback) errorCallback(err); }
  );
}

/** Listen to a single document in real-time */
export function fbListenDoc(collectionName, id, callback) {
  if (!_db) return () => {};
  return onSnapshot(
    doc(_db, collectionName, String(id)),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  );
}

/** Test Firebase connection by performing a lightweight Firestore read */
export async function testFirebaseConnection(config) {
  try {
    const testApp = getApps().find(a => a.name === '__ecare_test__') ||
      initializeApp(config, '__ecare_test__');
    const testDb = getFirestore(testApp);
    // Try listing a collection — any success means the project is reachable
    await getDocs(query(collection(testDb, 'ecare_connection_test'), limit(1)));
    return { success: true };
  } catch (e) {
    // A "permission-denied" error still proves the connection works (project exists)
    if (e.code === 'permission-denied' || e.code === 'PERMISSION_DENIED') {
      return { success: true };
    }
    return { success: false, error: e.message };
  }
}

// Re-export Firestore primitives for direct use if needed
export { collection, doc, query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, increment };
export { ref, uploadString, getDownloadURL, deleteObject };
