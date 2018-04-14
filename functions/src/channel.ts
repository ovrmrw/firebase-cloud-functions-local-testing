import * as functions from 'firebase-functions';
import { admin } from './admin';

const database = admin.database();

export const channel = functions.database
  .ref('channel/{accountId}/{userId}/{pushId}')
  .onCreate(async (snapshot, context) => {
    const { timestamp } = context;
    const { accountId, userId, pushId } = context.params;
    const val = snapshot.val();
    const updateChannel = snapshot.ref.update({
      ...val,
      accountId,
      userId,
      channelId: pushId,
      timestamp
    });
    const sessionize = sessionController(accountId, userId, pushId, timestamp);
    await Promise.all([updateChannel, sessionize]);
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
    const setSession = database.ref(sessionRefPath).set({
      ...val,
      endedAt: timestamp
    });
    const removeTempSession = database.ref(tempRefPath).remove();
    await Promise.all([setSession, removeTempSession]);
  } else {
    const setTempSession = database.ref(tempRefPath).set({
      accountId,
      userId,
      sessionId: pushId,
      startedAt: timestamp
    });
    await setTempSession;
  }
}
