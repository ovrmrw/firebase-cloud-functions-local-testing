import { DatabaseHelper } from '../../testing/helpers';
import { helloworld, getHelloRefPath } from '../../src/helloworld';

describe('helloworld', () => {
  let database: DatabaseHelper;
  const helloRefPath = getHelloRefPath();

  beforeEach(async () => {
    database = new DatabaseHelper();
    await database.refRemove(['hello']);
  });

  it('shoud send "Hello, World!" as a response.', done => {
    expect.assertions(2);
    const req: any = { query: {} };
    const res: any = {
      send: async body => {
        // レスポンスの内容を確認。
        expect(body).toEqual({ result: 'Hello, World!' });
        console.log('body:', body);
        await database.refOnceValue(helloRefPath).then(({ val }) => {
          // Realtime Databaseに書き込まれた内容を確認。
          expect(val).toEqual({ message: 'Hello, World!' });
        });
        done();
      }
    };
    helloworld(req, res);
  });

  it('should send "Hello, Foo!" as a response.', done => {
    expect.assertions(2);
    const req: any = { query: { name: 'Foo' } };
    const res: any = {
      send: async body => {
        // レスポンスの内容を確認。
        expect(body).toEqual({ result: 'Hello, Foo!' });
        console.log('body:', body);
        await database.refOnceValue(helloRefPath).then(({ val }) => {
          // Realtime Databaseに書き込まれた内容を確認。
          expect(val).toEqual({ message: 'Hello, Foo!' });
        });
        done();
      }
    };
    helloworld(req, res);
  });
});
