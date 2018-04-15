import * as path from 'path';
import * as fs from 'fs';

const ENV_JSON = 'env.test.json';

(() => {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const envJsonPath = path.join(path.resolve(), ENV_JSON);
    if (fs.existsSync(envJsonPath)) {
      const env = require(envJsonPath);
      if (env.GOOGLE_APPLICATION_CREDENTIALS) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = env.GOOGLE_APPLICATION_CREDENTIALS;
      }
    }
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return;
  }

  if (!process.env.FIREBASE_CONFIG) {
    const serviceAccountKeyPath = path.join(path.resolve(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(serviceAccountKeyPath)) {
      const serviceAccount = require(serviceAccountKeyPath);
      const projectId: string = serviceAccount.project_id;
      if (projectId) {
        const databaseURL = `https://${projectId}.firebaseio.com`;
        const storageBucket = `${projectId}.appspot.com`;

        process.env.FIREBASE_CONFIG = JSON.stringify({
          projectId,
          databaseURL,
          storageBucket
        });
      }
    }
  }

  if (!process.env.FIREBASE_CONFIG) {
    return;
  }

  if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  }
})();
