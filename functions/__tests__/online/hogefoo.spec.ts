import * as Test from 'firebase-functions-test';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import { DatabaseHelper, getFirebaseConfig, getInitializedApp } from '../../testing/helpers';
import { hogefoo } from '../../src/hogefoo'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。
import { DataSnapshot } from 'firebase-functions/lib/providers/database';

jest.setTimeout(1000 * 30);

describe('hogefoo', () => {
  let test: FeaturesList;
  let databaseHelper: DatabaseHelper;

  beforeEach(async () => {
    test = Test(getFirebaseConfig());
    databaseHelper = new DatabaseHelper();
    await databaseHelper.refRemove(['hoge']);
  });

  it('valueにpushIdとeventIdが付与される', async () => {
    expect.assertions(1);
    const pushId = 'pushId1';
    const eventId = 'eventId1';
    const hogeRefPath = `hoge/foo/${pushId}`;
    const value = { bar: 1 };
    const expected = { ...value, pushId, eventId };

    // action
    const snapshot = test.database.makeDataSnapshot(value, hogeRefPath);
    await databaseHelper.writeFakeSnapshot(snapshot);
    await test.wrap(hogefoo)(snapshot, { params: { pushId }, eventId });

    // database assertion
    await databaseHelper.refOnceValue(hogeRefPath).then(({ val }) => {
      expect(val).toEqual({
        ...value,
        pushId,
        eventId
      });
      console.log(`val at ${hogeRefPath}:`, val);
    });
  });
});
