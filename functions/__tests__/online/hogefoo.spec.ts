import { test } from '../../testing/env';
import { hogefoo } from '../../src/index'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。
import { initializeAppSafe, removeFromDatabase } from '../../testing/helpers';
import { AdminApp, Database } from '../../testing/types';

describe('hogefoo', () => {
  let app: AdminApp;
  let database: Database;

  beforeEach(() => {
    app = initializeAppSafe();
    database = app.database();
  });

  afterEach(async () => {
    await removeFromDatabase(['hoge']);
  });

  it('valueにpushIdとeventIdが付与される', async () => {
    const pushId = 'pushId1';
    const eventId = 'eventId1';
    const refPath = `hoge/foo/${pushId}`;
    const value = { bar: 1 };
    const expected = { ...value, pushId, eventId };

    const snapshot = test.database.makeDataSnapshot(value, refPath);
    await test.wrap(hogefoo)(snapshot, { params: { pushId }, eventId });

    await database
      .ref(refPath)
      .once('value')
      .then(createdSnapshot => {
        console.log('val:', createdSnapshot.val());
        expect(createdSnapshot.val()).toEqual(expected);
      });
  });
});
