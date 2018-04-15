import * as functions from 'firebase-functions';
import { getApp } from './admin';

const database = getApp().database();

/**
 * クエリパラメータに応じたレスポンスを返し、副作用としてRealtime Databaseにも書き込みをする。
 */
export const helloworld = functions.https.onRequest(async (req, res) => {
  const name = req.query.name || 'World';
  const message = `Hello, ${name}!`;

  const helloRefPath = getHelloRefPath();
  await database.ref(helloRefPath).set({
    message
  });
  res.send({ result: message });
});

export function getHelloRefPath(): string {
  return `hello`;
}
