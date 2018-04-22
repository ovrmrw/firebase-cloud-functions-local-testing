import * as admin from 'firebase-admin';
import * as PubSub from '@google-cloud/pubsub';

type DataSnapshot = admin.database.DataSnapshot;

export const projectId = process.env.GCLOUD_PROJECT;

/**
 * process.env.FIREBASE_CONFIGをオブジェクト化したものを返す。
 */
export function getFirebaseConfig(): admin.AppOptions | undefined {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

/**
 * admin.initializeApp()が未実行であれば実行した上でAppを返す。
 */
export function getInitializedApp(): admin.app.App {
  const name = '__TESTING__';
  const appForTesting = admin.apps.find(app => app.name === name);
  if (appForTesting) {
    return appForTesting;
  } else {
    return admin.initializeApp(getFirebaseConfig(), name);
  }
}

/**
 * Readltime Databaseに関する処理を簡潔に記述するためのヘルパークラス。
 */
export class DatabaseHelper {
  private database: admin.database.Database;

  constructor() {
    this.database = getInitializedApp().database();
  }

  async writeFakeSnapshot(snapshot: DataSnapshot): Promise<void> {
    await snapshot.ref.set(snapshot.val());
  }

  refOnceValue(refPath: string | string[]): Promise<{ val: any; snap: DataSnapshot }> {
    const _refPath: string = refPath instanceof Array ? refPath.join('/') : refPath;
    return this.database
      .ref(_refPath)
      .once('value')
      .then((snap: DataSnapshot) => ({
        val: snap.val(),
        snap: snap
      }));
  }

  refRemove(refPath: string | string[]): Promise<void> {
    const promises: Promise<void>[] =
      refPath instanceof Array
        ? refPath.map(path => this.database.ref(path).remove())
        : [this.database.ref(refPath).remove()];
    return Promise.all(promises).then(() => void 0);
  }
}

/**
 * PubSubに関する処理を簡潔に記述するためのヘルパークラス。
 */
export class PubsubHelper {
  private readonly publisherClient: any;
  private readonly subscriberClient: any;

  constructor() {
    this.publisherClient = new PubSub.v1.PublisherClient();
    this.subscriberClient = new PubSub.v1.SubscriberClient();
  }

  getProjectPath(): string {
    return this.publisherClient.projectPath(projectId);
  }

  getTopicPath(topicName: string): string {
    return this.publisherClient.topicPath(projectId, topicName);
  }

  getSubscriptionPath(subscriptionName: string): string {
    return this.subscriberClient.subscriptionPath(projectId, subscriptionName);
  }

  async createSubscription(subscriptionName: string, topicName: string): Promise<void> {
    await this.createTopic(topicName);
    await this.subscriberClient
      .createSubscription({
        name: this.getSubscriptionPath(subscriptionName),
        topic: this.getTopicPath(topicName)
      })
      // .then(responses => {
      //   const response = responses[0];
      //   console.log('created subscription:', response);
      // })
      .catch((err: Error) => {
        const { message } = err;
        if (!message.includes('ALREADY_EXISTS') && !message.includes('NOT_FOUND')) {
          console.error(err);
        }
      });
  }

  async deleteSubscription(subscriptionName: string): Promise<void> {
    await this.subscriberClient
      .deleteSubscription({ subscription: this.getSubscriptionPath(subscriptionName) })
      .catch((err: Error) => {
        const { message } = err;
        if (!message.includes('NOT_FOUND')) {
          console.error(err);
        }
      });
  }

  async pullMessages(subscriptionName: string, maxMessages: number = 1): Promise<ReceivedMessage[]> {
    const request = {
      subscription: this.getSubscriptionPath(subscriptionName),
      maxMessages: maxMessages
    };
    return this.subscriberClient
      .pull(request)
      .then(responses => {
        const response: PullResponse = responses[0];
        return response.receivedMessages;
      })
      .catch(err => {
        console.error(err);
      });
  }

  async createTopic(topicName: string): Promise<void> {
    const exists: boolean = await this.existsTopic(topicName);
    if (!exists) {
      await this.publisherClient
        .createTopic({ name: this.getTopicPath(topicName) })
        .then(results => {
          const topic = results[0];
          console.log(`Topic ${topic.name} is created.`);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  existsTopic(topicName: string): Promise<boolean> {
    return this.publisherClient
      .listTopics({ project: this.getProjectPath() })
      .then(responses => {
        const resources: { name: string }[] = responses[0];
        return !!resources.find(obj => obj.name === this.getTopicPath(topicName));
      })
      .catch(err => {
        console.error(err);
        return false;
      });
  }
}

interface PullResponse {
  receivedMessages: ReceivedMessage[];
}

interface ReceivedMessage {
  ackId: string;
  message: {
    attributes: Record<string, any>;
    data: Buffer;
    messageId: string;
    publishTime: {
      seconds: string;
      nanos: number;
    };
  };
}
