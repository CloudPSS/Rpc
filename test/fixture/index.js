import fs from 'node:fs/promises';
import { parse } from '../../dist/parser/index.js';
import { generate } from '../../dist/generator/index.js';

for (const file of await fs.readdir('./test/fixture')) {
    if (!file.endsWith('.thrift')) continue;
    const content = await fs.readFile(`./test/fixture/${file}`, 'utf8');
    const ast = parse(content, file);
    if (!ast) continue;
    const code = generate(ast);
    if (!code) continue;
    await fs.writeFile(`./test/fixture/${file}.ts`, code);
}
