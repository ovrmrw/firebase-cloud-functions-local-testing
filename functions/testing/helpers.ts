import * as admin from 'firebase-admin';

export type AdminApp = admin.app.App;

/**
 * admin.initializeApp()が未実行であれば実行した上でAppを返す。
 */
export function initializeAppSafe(): AdminApp {
  const name = 'TESTING';
  const appForTesting = admin.apps.find(app => app.name === name);
  if (appForTesting) {
    return appForTesting;
  } else {
    const config = JSON.parse(process.env.FIREBASE_CONFIG);
    return admin.initializeApp(config, name);
  }
}

/**
 * 指定したパスをRealtime Databaseから削除する。
 * @param refPath 削除するパス
 */
export function removeFromDatabase(refPath: string | string[]): Promise<void> {
  const database = initializeAppSafe().database();
  if (refPath instanceof Array) {
    const promises = refPath.map(path => database.ref(path).remove());
    return Promise.all(promises)
      .then(() => void 0)
      .catch(console.error);
  } else {
    return database
      .ref(refPath)
      .remove()
      .then(() => void 0)
      .catch(console.error);
  }
}
