import * as functions from 'firebase-functions';

export const hogefoo = functions.database.ref('hoge/foo/{pushId}').onCreate((snapshot, context) => {
  return snapshot.ref.update({
    pushId: context.params.pushId,
    eventId: context.eventId
  });
});
