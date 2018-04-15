// tslint:disable:no-implicit-dependencies
import * as Test from 'firebase-functions-test';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import { DatabaseHelper, getFirebaseConfig } from '../../testing/helpers';
import { hogefoo } from '../../src/hogefoo'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。

describe('hogefoo', () => {
  let test: FeaturesList;
  let database: DatabaseHelper;

  beforeEach(async () => {
    test = Test(getFirebaseConfig());
    database = new DatabaseHelper();
    await database.refRemove(['hoge']);
  });

  it('valueにpushIdとeventIdが付与される', async () => {
    expect.assertions(1);
    const pushId = 'pushId1';
    const eventId = 'eventId1';
    const hogeRefPath = `hoge/foo/${pushId}`;
    const value = { bar: 1 };
    const expected = { ...value, pushId, eventId };

    const snapshot = test.database.makeDataSnapshot(value, hogeRefPath);
    await test.wrap(hogefoo)(snapshot, { params: { pushId }, eventId });

    await database.refOnceValue(hogeRefPath).then(({ val }) => {
      // Realtime Databaseに書き込まれた内容を確認。
      expect(val).toEqual({
        ...value,
        pushId,
        eventId
      });
      console.log(`val at ${hogeRefPath}:`, val);
    });
  });
});
