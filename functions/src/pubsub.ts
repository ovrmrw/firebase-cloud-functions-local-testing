import * as functions from 'firebase-functions';
import { getApp } from './admin';
import * as PubSub from '@google-cloud/pubsub';

const database = getApp().database();
const publisherClient = new PubSub.v1.PublisherClient();
export const projectId = process.env.GCLOUD_PROJECT;
export const topicName = 'sample-topic';
const formattedProject = publisherClient.projectPath(projectId);
const formattedTopic = publisherClient.topicPath(projectId, topicName);

export const pubsub = functions.database
  .ref('pubsub/{accountId}/{userId}/{pushId}')
  .onCreate(async (snapshot, context) => {
    const val = snapshot.val();
    console.log('val', val);

    await createTopic(formattedTopic);
    const message = {
      data: Buffer.from(val) // Bufferにしないとinvalid encodingエラーが発生する。
    };
    const request = {
      topic: formattedTopic,
      messages: [message]
    };
    await publisherClient
      .publish(request)
      .then(responses => {
        const response = responses[0];
        // doThingsWith(response)
        console.log('response', response);
      })
      .catch(err => {
        console.error(err);
      });
  });

export function getPubsubRefPath(accountId: string, userId: string, pushId?: string): string {
  return pushId ? `pubsub/${accountId}/${userId}/${pushId}` : `pubsub/${accountId}/${userId}`;
}

async function existsTopic(_formattedTopic: string): Promise<boolean> {
  const exists: boolean = await publisherClient
    .listTopics({ project: formattedProject })
    .then(responses => {
      const resources: { name: string }[] = responses[0];
      console.log('resources', resources);
      return !!resources.find(obj => obj.name === _formattedTopic);
    })
    .catch(err => {
      console.error(err);
      return false;
    });
  return exists;
}

async function createTopic(_formattedTopic: string): Promise<void> {
  const topicExists: boolean = await existsTopic(_formattedTopic);
  if (!topicExists) {
    await publisherClient
      .createTopic({ name: _formattedTopic })
      .then(results => {
        const topic = results[0];
        console.log('topic', topic);
        console.log(`Topic ${topic.name} created.`);
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
  }
}
