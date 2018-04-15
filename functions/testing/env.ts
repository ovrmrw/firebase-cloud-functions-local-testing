// tslint:disable:no-import-side-effect
import '../scripts/load-test-env';
import * as path from 'path';

const serviceAccountKeyPath = path.join(path.resolve(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
const serviceAccount = require(serviceAccountKeyPath);

const projectId: string = serviceAccount.project_id;
const databaseURL = `https://${projectId}.firebaseio.com`;
const storageBucket = `${projectId}.appspot.com`;

if (!process.env.FIREBASE_CONFIG) {
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId,
    databaseURL,
    storageBucket
  });
}

console.log('projectId:', JSON.parse(process.env.FIREBASE_CONFIG).projectId);
