import { parse } from '../dist/parser/index.js';
import { generate } from '../dist/generator/index.js';
import fs from 'node:fs';
import util from 'util';

function build(name) {
    const data = fs.readFileSync(`./test/${name}.thrift`, 'utf8');
    const doc = parse(data, `./test/${name}.thrift`);
    if (doc) {
        const g = generate(doc);
        fs.writeFileSync(`./test/${name}.thrift.ts`, g);
        // delete doc.text;
        // //console.log(data);
        // console.log(
        //     util.inspect(doc, {
        //         colors: true,
        //         depth: null,
        //     }),
        // );
    } else {
        fs.writeFileSync(`./test/${name}.thrift.ts`, '');
    }
}
build('base');
build('room');
