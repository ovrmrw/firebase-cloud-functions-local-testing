import * as admin from 'firebase-admin';

type DataSnapshot = admin.database.DataSnapshot;

/**
 * admin.initializeApp()が未実行であれば実行した上でAppを返す。
 */
export function initializeAppSafe(): admin.app.App {
  const name = '__TESTING__';
  const appForTesting = admin.apps.find(app => app.name === name);
  if (appForTesting) {
    return appForTesting;
  } else {
    return admin.initializeApp(undefined, name);
  }
}

/**
 * Readltime Databaseに関する処理を簡潔に記述するためのヘルパークラス。
 */
export class DatabaseHelper {
  private database: admin.database.Database;

  constructor(app: admin.app.App) {
    this.database = app.database();
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
