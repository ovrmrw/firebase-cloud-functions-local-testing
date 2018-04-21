import * as Test from 'firebase-functions-test';
import { FeaturesList } from 'firebase-functions-test/lib/features';
import * as PubSub from '@google-cloud/pubsub';
import { DatabaseHelper, getFirebaseConfig } from '../../testing/helpers';
import { pubsub, projectId, topicName, getPubsubRefPath } from '../../src/pubsub';

describe.only('pubsub', () => {
  let test: FeaturesList;
  let database: DatabaseHelper;
  let publisherClient: any;
  let subscriberClient: any;
  let formattedSubscription: string;
  let formattedTopic: string;

  beforeEach(async () => {
    test = Test(getFirebaseConfig());
    database = new DatabaseHelper();
    // await database.refRemove(['pubsub']);
    publisherClient = new PubSub.v1.PublisherClient();
    formattedTopic = publisherClient.topicPath(projectId, topicName);
    // await publisherClient.deleteTopic({ topic: formattedTopic }).catch(err => {
    //   // console.error(err);
    // });
    subscriberClient = new PubSub.v1.SubscriberClient();
    formattedSubscription = subscriberClient.subscriptionPath(projectId, 'sample-subscription');
    // await subscriberClient.deleteSubscription({ subscription: formattedSubscription }).catch(err => {
    //   // console.error(err);
    // });
  });

  it('fail test', async () => {
    expect.assertions(1);
    const accountId = 'accountId1';
    const userId = 'userId1';
    const pushId = 'pushId1';
    const pubsubRefPath = getPubsubRefPath(accountId, userId, pushId);
    const value = 'foooooooooooo';

    // const formattedSubscription = subscriberClient.subscriptionPath(projectId, topicName);

    const snapshot = test.database.makeDataSnapshot(value, pubsubRefPath);
    await test.wrap(pubsub)(snapshot, { params: { accountId, userId, pushId } });

    console.log(1);
    // await subscriberClient
    //   .createSubscription({
    //     name: formattedSubscription,
    //     topic: formattedTopic
    //   })
    //   .then(responses => {
    //     const response = responses[0];
    //     // doThingsWith(response)
    //     console.log('response', response);
    //   })
    //   .catch(err => {
    //     console.error(err);
    //   });

    // await database.refOnceValue(pubsubRefPath).then(({ val }) => {
    //   // Realtime Databaseに書き込まれた内容を確認。
    //   expect(val).toEqual(value);
    //   console.log(`val at ${pubsubRefPath}:`, val);
    // });

    const maxMessages = 1;
    const request = {
      subscription: formattedSubscription,
      maxMessages: maxMessages
    };
    await subscriberClient
      .pull(request)
      .then(responses => {
        const response = responses[0];
        console.log('subscriber response:', response);
        const receivedMessage = response.receivedMessages[0];
        const data: Buffer = receivedMessage.message.data;
        expect(data.toString()).toBe(value);
      })
      .catch(err => {
        console.log('!!!!!!');
        console.error(err);
      });
  });
});
