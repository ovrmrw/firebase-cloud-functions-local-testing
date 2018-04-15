import * as admin from 'firebase-admin';

export function getApp(): admin.app.App {
  const name = '__PRODUCTION__';
  const appForProduction = admin.apps.find(app => app.name === name);
  if (appForProduction) {
    return appForProduction;
  } else {
    return admin.initializeApp(getFirebaseConfig(), name);
  }
}

function getFirebaseConfig(): admin.AppOptions | undefined {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
