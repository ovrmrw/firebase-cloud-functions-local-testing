// tslint:disable:no-implicit-dependencies
import * as fs from 'fs';
import * as path from 'path';
import * as Test from 'firebase-functions-test';

const firebasercPath = path.join(path.resolve(), '../.firebaserc');
const firebaserc: any = JSON.parse(fs.readFileSync(firebasercPath).toString());

export const projectId: string = firebaserc.projects.default;
export const databaseURL = `https://${projectId}.firebaseio.com`;

console.log('projectId:', projectId);
console.log('databaseURL:', databaseURL);

export const test = Test({ projectId, databaseURL });

console.log('process.env.FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG);
