// tslint:disable:no-implicit-dependencies
import * as assert from 'assert';
import * as Test from 'firebase-functions-test';

export const serviceAccount = require('../../secrets/serviceAccountKey.testing.json');

const projectId: string = serviceAccount.project_id;
const databaseURL = `https://${projectId}.firebaseio.com`;

export const test = Test({
  projectId,
  databaseURL
});

try {
  const { projectId: _projectId, databaseURL: _databaseURL } = JSON.parse(
    process.env.FIREBASE_CONFIG
  );
  assert(!!_projectId);
  assert(!!_databaseURL);
} catch (err) {
  console.log('process.env.FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG);
  throw err;
}
