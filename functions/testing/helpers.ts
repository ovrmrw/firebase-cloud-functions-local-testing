import * as admin from 'firebase-admin';
import { serviceAccount } from './env';

/**
 * admin.initializeApp()が未実行であれば実行した上でAppを返す。
 */
export function initializeAppSafe(): admin.app.App {
  const name = '__TESTING__';
  const appForTesting = admin.apps.find(app => app.name === name);
  if (appForTesting) {
    return appForTesting;
  } else {
    const config = {
      ...JSON.parse(process.env.FIREBASE_CONFIG),
      credential: admin.credential.cert(serviceAccount)
    };
    return admin.initializeApp(config, name);
  }
}

/**
 * 指定したパスをRealtime Databaseから削除する。
 * @param refPath 削除するパス
 */
export function removeFromDatabase(refPath: string | string[]): Promise<void> {
  const database = initializeAppSafe().database();
  const promises: Promise<void>[] =
    refPath instanceof Array
      ? refPath.map(path => database.ref(path).remove())
      : [database.ref(refPath).remove()];
  return Promise.all(promises)
    .then(() => void 0)
    .catch(console.error);
}
