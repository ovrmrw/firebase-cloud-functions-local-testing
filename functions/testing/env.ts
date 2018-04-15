// tslint:disable:no-implicit-dependencies
// tslint:disable:no-import-side-effect
import '../scripts/load-test-env';
import * as path from 'path';
import * as assert from 'assert';
import * as admin from 'firebase-admin';
import * as Test from 'firebase-functions-test';

const SERVICE_ACCOUNT_KEY_PATH = path.join(
  path.resolve(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

export const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);

const projectId: string = serviceAccount.project_id;
const databaseURL = `https://${projectId}.firebaseio.com`;
const storageBucket = `${projectId}.appspot.com`;

// credentialを設定すると色々エラーを吐くのでコメントアウトしている。
export const test = Test({
  projectId,
  databaseURL,
  storageBucket
  // credential: admin.credential.cert({
  //   projectId,
  //   clientEmail: serviceAccount.client_email,
  //   privateKey: serviceAccount.private_key
  // })
});

try {
  const {
    projectId: _projectId,
    databaseURL: _databaseURL,
    storageBucket: _storageBucket
  } = JSON.parse(process.env.FIREBASE_CONFIG);
  assert(!!_projectId);
  assert(!!_databaseURL);
  assert(!!_storageBucket);
  console.log('process.env.FIREBASE_CONFIG:', JSON.parse(process.env.FIREBASE_CONFIG));
} catch (err) {
  throw err;
}
