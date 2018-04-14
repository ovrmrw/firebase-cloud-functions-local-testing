import * as functions from 'firebase-functions';
import { admin } from './admin';

const database = admin.database();

export const channel = functions.database
  .ref('channel/{accountId}/{userId}/{pushId}')
  .onCreate(async (snapshot, context) => {
    const { timestamp } = context;
    const { accountId, userId, pushId } = context.params;
    const val = snapshot.val();
    const update = snapshot.ref.update({
      ...val,
      accountId,
      userId,
      channelId: pushId,
      timestamp
    });
    const session = sessionController(accountId, userId, pushId, timestamp);
    await Promise.all([update, session]);
  });

async function sessionController(
  accountId: string,
  userId: string,
  pushId: string,
  timestamp: string
) {
  const tempRefPath = `_session/${accountId}/${userId}`;
  const session = await database.ref(tempRefPath).once('value');
  const val = session.val();
  if (val) {
    const sessionRefPath = `session/${accountId}/${userId}/${val.sessionId}`;
    const set = database.ref(sessionRefPath).set({
      ...val,
      endedAt: timestamp
    });
    const remove = database.ref(tempRefPath).remove();
    await Promise.all([set, remove]);
  } else {
    await database.ref(tempRefPath).set({
      accountId,
      userId,
      sessionId: pushId,
      startedAt: timestamp
    });
  }
}
