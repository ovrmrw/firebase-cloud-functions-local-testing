import { test } from '../../testing/env';
import { initializeAppSafe, DatabaseHelper } from '../../testing/helpers';
import { hogefoo } from '../../src/index'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。

describe('hogefoo', () => {
  let database: DatabaseHelper;

  beforeEach(async () => {
    const app = initializeAppSafe();
    database = new DatabaseHelper(app);
    await database.refRemove(['/hoge/']);
  });

  it('valueにpushIdとeventIdが付与される', async () => {
    const pushId = 'pushId1';
    const eventId = 'eventId1';
    const refPath = `/hoge/foo/${pushId}`;
    const value = { bar: 1 };
    const expected = { ...value, pushId, eventId };

    const snapshot = test.database.makeDataSnapshot(value, refPath);
    await test.wrap(hogefoo)(snapshot, { params: { pushId }, eventId });

    await database.refOnceValue(refPath).then(({ val }) => {
      expect(val).toEqual({
        ...value,
        pushId,
        eventId
      });
      console.log(`val at ${refPath}:`, val);
    });
  });
});
