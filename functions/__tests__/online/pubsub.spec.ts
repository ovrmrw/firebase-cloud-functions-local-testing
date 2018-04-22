import * as Test from 'firebase-functions-test';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import { DatabaseHelper, getFirebaseConfig, PubsubHelper } from '../../testing/helpers';
import { pubsub, topicName, getPubsubRefPath } from '../../src/pubsub';

jest.setTimeout(1000 * 30);

describe('pubsub', () => {
  let test: FeaturesList;
  let databaseHelper: DatabaseHelper;
  let pubsubHelper: PubsubHelper;
  const subscriptionName = 'sample-subscription__test';

  beforeEach(async () => {
    test = Test(getFirebaseConfig());
    databaseHelper = new DatabaseHelper();
    await databaseHelper.refRemove(['pubsub']);
    pubsubHelper = new PubsubHelper();
    await pubsubHelper.deleteSubscription(subscriptionName);
    await pubsubHelper.createSubscription(subscriptionName, topicName);
  });

  it('Databaseに書き込まれているとともに、Topicにもメッセージが送られている。', async () => {
    expect.assertions(3);
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId = 'pushId1';
    const pubsubRefPath = getPubsubRefPath(accountId, userId, pushId);
    const value = { bar: 1 };

    // action
    const snapshot = test.database.makeDataSnapshot(value, pubsubRefPath);
    await databaseHelper.writeFakeSnapshot(snapshot);
    await test.wrap(pubsub)(snapshot, { params: { accountId, userId, pushId } });

    // database assertion
    await databaseHelper.refOnceValue(pubsubRefPath).then(({ val }) => {
      expect(val).toEqual(value);
      console.log(`val at ${pubsubRefPath}:`, val);
    });

    // pubsub message assertion
    const messages = await pubsubHelper.pullMessages(subscriptionName);
    expect(messages.length).toBe(1);
    const firstMessage = JSON.parse(messages[0].message.data.toString());
    expect(JSON.parse(messages[0].message.data.toString())).toEqual(value);
    console.log('first message:', firstMessage);
  });

  it('Topicに2回メッセージが送られている。', async () => {
    expect.assertions(4);
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId1 = 'pushId1';
    const pushId2 = 'pushId2';
    const value1 = { bar: 1 };
    const value2 = { bar: 2 };

    // first action
    const pubsubRefPath1 = getPubsubRefPath(accountId, userId, pushId1);
    const snapshot1 = test.database.makeDataSnapshot(value1, pubsubRefPath1);
    await databaseHelper.writeFakeSnapshot(snapshot1);
    await test.wrap(pubsub)(snapshot1, { params: { accountId, userId, pushId1 } });
    // second action
    const pubsubRefPath2 = getPubsubRefPath(accountId, userId, pushId2);
    const snapshot2 = test.database.makeDataSnapshot(value2, pubsubRefPath2);
    await databaseHelper.writeFakeSnapshot(snapshot2);
    await test.wrap(pubsub)(snapshot2, { params: { accountId, userId, pushId2 } });

    // database assertion
    await databaseHelper.refOnceValue(getPubsubRefPath(accountId, userId)).then(({ val }) => {
      expect(val).toEqual({
        [pushId1]: value1,
        [pushId2]: value2
      });
      console.log(`val at ${getPubsubRefPath(accountId, userId)}:`, val);
    });

    // pubsub message assertions
    const messages = await pubsubHelper.pullMessages(subscriptionName, 2);
    expect(messages.length).toBe(2);
    const firstMessage = JSON.parse(messages[0].message.data.toString());
    expect(firstMessage).toEqual(value1);
    const secondMessage = JSON.parse(messages[1].message.data.toString());
    expect(secondMessage).toEqual(value2);
    console.log('first message:', firstMessage);
    console.log('second message:', secondMessage);
  });
});
