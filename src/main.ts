import { data, DataType } from './data';
import { MsgPackMidis } from './MsgPackMidis';
import { buff2hex, getBytesFromString } from './utils';

const rawresult = getBytesFromString(JSON.stringify(data)).length;

console.log(rawresult, 'bytes raw json');

const coder = new MsgPackMidis();

const result = coder.encode(data);
const decodeResult = coder.decode([...result]);

console.log(decodeResult);

console.log(buff2hex(result), '\n', result.length, 'bytes encoded');
console.log('Less: ', ((1 - result.length / rawresult) * 100).toFixed(2) + '%');

export {};
