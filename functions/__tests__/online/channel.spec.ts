import { test } from '../../testing/env';
import { initializeAppSafe, removeFromDatabase } from '../../testing/helpers';
import { AdminApp, Database } from '../../testing/types';
import { channel } from '../../src/index'; // process.env.FIREBASE_CONFIGの定義後にimportしないとエラーになる。

describe('channel', () => {
  let app: AdminApp;
  let database: Database;

  beforeEach(async () => {
    app = initializeAppSafe();
    database = app.database();
    await removeFromDatabase(['/_session/', '/session/', '/channel/']);
  });

  it('valueにaccountId, userId, pushId, timestampが付与され、sessionがスタートする。', async () => {
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId = 'pushId1';
    const timestamp = 'timestamp1';
    const channelRefPath = `/channel/${accountId}/${userId}/${pushId}`;
    const value = { bar: 1 };

    const snapshot = test.database.makeDataSnapshot(value, channelRefPath);
    await test.wrap(channel)(snapshot, {
      params: { accountId, userId, pushId },
      timestamp
    });

    const channelAssert = database
      .ref(channelRefPath)
      .once('value')
      .then(snap => {
        expect(snap.val()).toEqual({
          ...value,
          accountId,
          userId,
          channelId: pushId,
          sessionId: pushId,
          timestamp
        });
        console.log(`val at ${channelRefPath}:`, snap.val());
      });
    const tempSessionRefPath = `/_session/${accountId}/${userId}`;
    const tempSessionAssert = app
      .database()
      .ref(tempSessionRefPath)
      .once('value')
      .then(snap => {
        expect(snap.val()).toEqual({
          accountId,
          userId,
          sessionId: pushId,
          startedAt: timestamp
        });
        console.log(`val at ${tempSessionRefPath}:`, snap.val());
      });
    const sessionAssert = app
      .database()
      .ref(`/session/${accountId}/${userId}`)
      .once('value')
      .then(snap => {
        expect(snap.val()).toBeNull();
      });
    await Promise.all([channelAssert, tempSessionAssert, sessionAssert]);
  });

  it('channelに2回目の書き込みが行われるとsessionが完了する。', async () => {
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId1 = 'pushId1';
    const pushId2 = 'pushId2';
    const timestamp1 = 'timestamp1';
    const timestamp2 = 'timestamp2';
    const channelRefPath = `/channel/${accountId}/${userId}/`;
    const value = { bar: 1 };

    const snapshot1 = test.database.makeDataSnapshot(value, `${channelRefPath}/${pushId1}`);
    await test.wrap(channel)(snapshot1, {
      params: { accountId, userId, pushId: pushId1 },
      timestamp: timestamp1
    });
    const snapshot2 = test.database.makeDataSnapshot(value, `${channelRefPath}/${pushId2}`);
    await test.wrap(channel)(snapshot2, {
      params: { accountId, userId, pushId: pushId2 },
      timestamp: timestamp2
    });

    const channelRefPath2 = `${channelRefPath}/${pushId2}`;
    const channelAssert = database
      .ref(channelRefPath2)
      .once('value')
      .then(snap => {
        expect(snap.val()).toEqual({
          ...value,
          accountId,
          userId,
          channelId: pushId2,
          sessionId: pushId1,
          timestamp: timestamp2
        });
        console.log(`val at ${channelRefPath2}:`, snap.val());
      });
    const tempSessionAssert = database
      .ref(`_session/${accountId}/${userId}`)
      .once('value')
      .then(snap => {
        expect(snap.val()).toBeNull();
      });
    const sessionRefPath = `session/${accountId}/${userId}/${pushId1}`;
    const sessionAssert = database
      .ref(sessionRefPath)
      .once('value')
      .then(snap => {
        expect(snap.val()).toEqual({
          accountId,
          userId,
          sessionId: pushId1,
          startedAt: timestamp1,
          endedAt: timestamp2
        });
        console.log(`val at ${sessionRefPath}:`, snap.val());
      });
    await Promise.all([channelAssert, tempSessionAssert, sessionAssert]);
  });
});
