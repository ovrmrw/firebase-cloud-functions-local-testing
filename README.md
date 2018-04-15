# firebase-cloud-functions-local-testing

---

## わかったこと

- Cloud Functions のテストは副作用ばかりなのでローカルに閉じてモックするより実際に動かすテスト(オンラインテスト)をした方が早い。
- serviceAccountKey を使うことでテスト用のFirebaseプロジェクトでテストすることができる。
- `process.env.GOOGLE_APPLICATION_CREDENTIALS` にserviceAccountKey.jsonまでのファイルパスを指定すると `firebase login` していなくてもオンラインテストができる。
- firebase-functions-test を使うとオンラインテストができる。
- `admin.initializeApp()` は常に一度だけ実行する仕組みを用意したほうが良い。
- `HTTP Error: 400, Invalid project ID specified` というエラーが表示されたら `firebase init` をやり直すと直る。
- `process.env.FIREBASE_CONFIG` が定義されていないとエラーになる処理がある。
- `firebase serve` でserveできるのはHTTPトリガーのFunctionだけ。
- `firebase functions:shell` を使うと全てのFunctionをローカルで実行できる。ただしその副作用は実際のFirebaseプロジェクトに反映される。
- shellでFunctionを叩くとき、同名のFunctionが既にデプロイされていればサーバーにログが残る。
- FunctionをデプロイしてしまっているとオンラインテストのときにローカルのFunctionとサーバーのFunctionの両方がイベントに対して発火してしまい、テストで嵌まる。
- `npm test` がエラーを吐きまくるときは一旦 `npm start` をしてからやり直すと成功したりする。
