import { DatabaseHelper } from '../../testing/helpers';
import { helloworld, getHelloRefPath } from '../../src/helloworld';

jest.setTimeout(1000 * 30);

describe('helloworld', () => {
  let database: DatabaseHelper;
  const helloRefPath = getHelloRefPath();

  beforeEach(() => {
    database = new DatabaseHelper();
  });

  beforeEach(async () => {
    // initialize testing environment
    await database.refRemove(['hello']);
  });

  it('shoud send "Hello, World!" as a response.', done => {
    expect.assertions(2);
    const req: any = { query: {} };
    const res: any = {
      send: async body => {
        // assertions
        expect(body).toEqual({ result: 'Hello, World!' });
        console.log('body:', body);

        // database assertion
        await database.refOnceValue(helloRefPath).then(({ val }) => {
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
        // assertions
        expect(body).toEqual({ result: 'Hello, Foo!' });
        console.log('body:', body);

        // database assertion
        await database.refOnceValue(helloRefPath).then(({ val }) => {
          expect(val).toEqual({ message: 'Hello, Foo!' });
        });
        done();
      }
    };
    helloworld(req, res);
  });
});
