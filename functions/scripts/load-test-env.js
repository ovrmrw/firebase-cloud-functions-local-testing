const path = require('path');

const ENV_FILE = '.env.test';

require('dotenv').config({ path: path.join(path.resolve(), ENV_FILE) });
