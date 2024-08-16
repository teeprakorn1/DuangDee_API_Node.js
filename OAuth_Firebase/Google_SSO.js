const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

//OAuth Use Google Service
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;

