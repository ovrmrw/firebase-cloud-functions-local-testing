import { test } from '../../testing/env';
import { hogefoo } from '../../src/index'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。
import { initializeAppSafe, removeFromDatabase, AdminApp } from '../../testing/helpers';

describe('hogefoo', () => {
  let app: AdminApp;

  beforeEach(() => {
    app = initializeAppSafe();
  });

  it('valueにpushIdとeventIdが付与される', async () => {
    const eventId = 'eventId1';
    const pushId = 'pushId1';
    const refPath = `hoge/foo/${pushId}`;
    const value = { bar: 1 };
    const expected = { ...value, pushId, eventId };
    const snapshot = test.database.makeDataSnapshot(value, refPath);
    const wrapped = test.wrap(hogefoo);
    await wrapped(snapshot, { params: { pushId }, eventId });
    await app
      .database()
      .ref(refPath)
      .once('value')
      .then(createdSnapshot => {
        console.log('val:', createdSnapshot.val());
        expect(createdSnapshot.val()).toEqual(expected);
      });
    await removeFromDatabase(refPath);
  });
});
