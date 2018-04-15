import * as functions from 'firebase-functions';
import { getApp } from './admin';

const database = getApp().database();

export const channel = functions.database
  .ref('channel/{accountId}/{userId}/{pushId}')
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
  const channelRefPath = getChannelRefPath(accountId, userId, pushId);
  const tempSessionRefPath = getTempSessionRefPath(accountId, userId);
  const val = await database
    .ref(tempSessionRefPath)
    .once('value')
    .then(snap => snap.val());
  const sessionId = val && val.sessionId ? val.sessionId : pushId;
  if (val) {
    const sessionRefPath = getSessionRefPath(accountId, userId, sessionId);
    const setSession = database.ref(sessionRefPath).set({
      ...val,
      endedAt: timestamp
    });
    const removeTempSession = database.ref(tempSessionRefPath).remove();
    await Promise.all([setSession, removeTempSession]);
  } else {
    const setTempSession = database.ref(tempSessionRefPath).set({
      accountId,
      userId,
      sessionId,
      startedAt: timestamp
    });
    await setTempSession;
  }
  const updateChannel = database.ref(channelRefPath).update({
    sessionId,
    timestamp
  });
  await updateChannel;
}

export function getChannelRefPath(accountId: string, userId: string, pushId?: string): string {
  return pushId ? `channel/${accountId}/${userId}/${pushId}` : `channel/${accountId}/${userId}`;
}

export function getTempSessionRefPath(accountId: string, userId: string): string {
  return `_session/${accountId}/${userId}`;
}

export function getSessionRefPath(accountId: string, userId: string, sessionId?: string): string {
  return sessionId ? `session/${accountId}/${userId}/${sessionId}` : `session/${accountId}/${userId}`;
}
