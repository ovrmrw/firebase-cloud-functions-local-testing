// tslint:disable:no-implicit-dependencies
import * as Test from 'firebase-functions-test';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import { DatabaseHelper, getFirebaseConfig } from '../../testing/helpers';
import { channel, getChannelRefPath, getTempSessionRefPath, getSessionRefPath } from '../../src/channel'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。

describe('channel', () => {
  let test: FeaturesList;
  let database: DatabaseHelper;

  beforeEach(async () => {
    test = Test(getFirebaseConfig());
    database = new DatabaseHelper();
    await database.refRemove(['_session', 'session', 'channel']);
  });

  it('valueにaccountId, userId, pushId, timestampが付与され、sessionがスタートする。', async () => {
    expect.assertions(3);
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId = 'pushId1';
    const timestamp = '2018-01-01T00:00:01.000Z';
    const channelRefPath = getChannelRefPath(accountId, userId, pushId);
    const value = { bar: 1 };

    const snapshot = test.database.makeDataSnapshot(value, channelRefPath);
    await test.wrap(channel)(snapshot, {
      params: { accountId, userId, pushId },
      timestamp
    });

    const channelAssert = database.refOnceValue(channelRefPath).then(({ val }) => {
      expect(val).toEqual({
        ...value,
        accountId,
        userId,
        channelId: pushId,
        sessionId: pushId,
        timestamp
      });
      console.log(`val at ${channelRefPath}:`, val);
    });
    const tempSessionRefPath = getTempSessionRefPath(accountId, userId);
    const tempSessionAssert = database.refOnceValue(tempSessionRefPath).then(({ val }) => {
      expect(val).toEqual({
        accountId,
        userId,
        sessionId: pushId,
        startedAt: timestamp
      });
      console.log(`val at ${tempSessionRefPath}:`, val);
    });
    const sessionRefPath = getSessionRefPath(accountId, userId);
    const sessionAssert = database.refOnceValue(sessionRefPath).then(({ val }) => {
      expect(val).toBeNull();
    });
    await Promise.all([channelAssert, tempSessionAssert, sessionAssert]);
  });

  it('channelに2回目の書き込みが行われるとsessionが完了する。', async () => {
    expect.assertions(3);
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId1 = 'pushId1';
    const pushId2 = 'pushId2';
    const timestamp1 = '2018-01-01T00:00:01.000Z';
    const timestamp2 = '2018-01-01T00:00:02.000Z';
    const channelRefPath = getChannelRefPath(accountId, userId);
    const value = { bar: 1 };

    const channelRefPath1 = `${channelRefPath}/${pushId1}`;
    const snapshot1 = test.database.makeDataSnapshot(value, channelRefPath1);
    await test.wrap(channel)(snapshot1, {
      params: { accountId, userId, pushId: pushId1 },
      timestamp: timestamp1
    });
    const channelRefPath2 = `${channelRefPath}/${pushId2}`;
    const snapshot2 = test.database.makeDataSnapshot(value, channelRefPath2);
    await test.wrap(channel)(snapshot2, {
      params: { accountId, userId, pushId: pushId2 },
      timestamp: timestamp2
    });

    const channelAssert = database.refOnceValue(channelRefPath2).then(({ val }) => {
      expect(val).toEqual({
        ...value,
        accountId,
        userId,
        channelId: pushId2,
        sessionId: pushId1,
        timestamp: timestamp2
      });
      console.log(`val at ${channelRefPath2}:`, val);
    });
    const tempSessionRefPath = getTempSessionRefPath(accountId, userId);
    const tempSessionAssert = database.refOnceValue(tempSessionRefPath).then(({ val }) => {
      expect(val).toBeNull();
    });
    const sessionRefPath = getSessionRefPath(accountId, userId, pushId1);
    const sessionAssert = database.refOnceValue(sessionRefPath).then(({ val }) => {
      expect(val).toEqual({
        accountId,
        userId,
        sessionId: pushId1,
        startedAt: timestamp1,
        endedAt: timestamp2
      });
      console.log(`val at ${sessionRefPath}:`, val);
    });
    await Promise.all([channelAssert, tempSessionAssert, sessionAssert]);
  });
});
