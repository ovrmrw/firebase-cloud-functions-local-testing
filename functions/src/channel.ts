import * as functions from 'firebase-functions';
import { admin } from './admin';

const database = admin.database();

export const channel = functions.database
  .ref('/channel/{accountId}/{userId}/{pushId}')
  .onCreate(async (snapshot, context) => {
    const { timestamp } = context;
    const { accountId, userId, pushId } = context.params;
    const val = snapshot.val();
    const updateChannel = database.ref(snapshot.ref).update({
      ...val,
      accountId,
      userId,
      channelId: pushId,
      timestamp
    });
    await updateChannel;
    const sessionize = sessionizer(accountId, userId, pushId, timestamp);
    await sessionize;
  });

async function sessionizer(accountId: string, userId: string, pushId: string, timestamp: string) {
  const channelRefPath = `/channel/${accountId}/${userId}/${pushId}`;
  const tempSessionRefPath = `/_session/${accountId}/${userId}`;
  const session = await admin
    .database()
    .ref(tempSessionRefPath)
    .once('value');
  const val = session.val();
  if (val) {
    const sessionId = val.sessionId;
    const sessionRefPath = `/session/${accountId}/${userId}/${sessionId}`;
    const setSession = database.ref(sessionRefPath).set({
      ...val,
      endedAt: timestamp
    });
    const removeTempSession = database.ref(tempSessionRefPath).remove();
    const updateChannel = database.ref(channelRefPath).update({
      sessionId,
      timestamp
    });
    await Promise.all([setSession, removeTempSession, updateChannel]);
  } else {
    const sessionId = pushId;
    const setTempSession = database.ref(tempSessionRefPath).set({
      accountId,
      userId,
      sessionId,
      startedAt: timestamp
    });
    const updateChannel = database.ref(channelRefPath).update({
      sessionId,
      timestamp
    });
    await Promise.all([setTempSession, updateChannel]);
  }
}
