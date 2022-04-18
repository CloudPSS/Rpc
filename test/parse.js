import { parse } from '../dist/parser/thrift-idl.g.js';
import { generate } from '../dist/generator/index.js';
import fs from 'node:fs';
import util from 'util';

const data = fs.readFileSync('./test/room.thrift', 'utf8');
const doc = parse(data);
console.log(data);
console.log(
    util.inspect(doc, {
        colors: true,
        depth: null,
    }),
);
console.log(generate(doc));
