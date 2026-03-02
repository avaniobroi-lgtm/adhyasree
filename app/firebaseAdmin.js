const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : null;

try {
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
            credential: admin.credential.cert(require(serviceAccountPath)),
            projectId: "focus-fun-b4047"
        });
        console.log('Firebase Admin initialized with service account');
    } else {
        console.warn('WARNING: google-application-credentials not found or not set correctly. Attempting default initialization...');
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: "focus-fun-b4047"
        });
        console.log('Firebase Admin initialized with applicationDefault');
    }
} catch (error) {
    console.error('CRITICAL: Firebase Admin initialization failed:', error.message);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
