import './env';
import * as admin from 'firebase-admin';

type DataSnapshot = admin.database.DataSnapshot;

/**
 * process.env.FIREBASE_CONFIGをオブジェクト化したものを返す。
 */
export function getFirebaseConfig(): admin.AppOptions | undefined {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

/**
 * admin.initializeApp()が未実行であれば実行した上でAppを返す。
 */
export function getInitializedApp(): admin.app.App {
  const name = '__TESTING__';
  const appForTesting = admin.apps.find(app => app.name === name);
  if (appForTesting) {
    return appForTesting;
  } else {
    return admin.initializeApp(getFirebaseConfig(), name);
  }
}

/**
 * Readltime Databaseに関する処理を簡潔に記述するためのヘルパークラス。
 */
export class DatabaseHelper {
  private database: admin.database.Database;

  constructor() {
    this.database = getInitializedApp().database();
  }

  refOnceValue(refPath: string | string[]): Promise<{ val: any; snap: DataSnapshot }> {
    const _refPath: string = refPath instanceof Array ? '/' + refPath.join('/') : refPath;
    return this.database
      .ref(_refPath)
      .once('value')
      .then((snap: DataSnapshot) => ({
        val: snap.val(),
        snap: snap
      }));
  }

  refRemove(refPath: string | string[]): Promise<void> {
    const promises: Promise<void>[] =
      refPath instanceof Array
        ? refPath.map(path => this.database.ref(path).remove())
        : [this.database.ref(refPath).remove()];
    return Promise.all(promises).then(() => void 0);
  }
}
