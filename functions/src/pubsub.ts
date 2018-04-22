import * as functions from 'firebase-functions';
import { getApp, projectId } from './admin';
import * as PubSub from '@google-cloud/pubsub';
import { logger } from './helpers';

const database = getApp().database();
const publisherClient = new PubSub.v1.PublisherClient();
export const topicName = 'sample-topic';
const topicPath = publisherClient.topicPath(projectId, topicName);

export const pubsub = functions.database
  .ref('pubsub/{accountId}/{userId}/{pushId}')
  .onCreate(async (snapshot, context) => {
    const val = snapshot.val();
    const message = {
      data: Buffer.from(JSON.stringify(val)) // Bufferにしないとinvalid encodingエラーが発生する。
    };
    const request = {
      topic: topicPath,
      messages: [message]
    };
    await publisherClient.publish(request).catch(err => {
      console.error(err);
    });
  });

export function getPubsubRefPath(accountId: string, userId: string, pushId?: string): string {
  return pushId ? `pubsub/${accountId}/${userId}/${pushId}` : `pubsub/${accountId}/${userId}`;
}
