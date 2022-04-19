import { parse } from '../dist/parser/index.js';
import { generate } from '../dist/generator/index.js';
import fs from 'node:fs';
import util from 'util';

const data = fs.readFileSync('./test/room.thrift', 'utf8');
const doc = parse(data, './test/room.thrift');
//console.log(data);
console.log(
    util.inspect(doc, {
        colors: true,
        depth: null,
    }),
);
const g = generate(doc);
fs.writeFileSync('./test/room.thrift.ts', g);
