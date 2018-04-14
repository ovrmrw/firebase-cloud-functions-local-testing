import * as functions from 'firebase-functions';

export const hogefoo = functions.database.ref('hoge/foo/{pushId}').onCreate((snapshot, context) => {
  const val = snapshot.val();
  return snapshot.ref.update({
    ...val,
    pushId: context.params.pushId,
    eventId: context.eventId
  });
});
