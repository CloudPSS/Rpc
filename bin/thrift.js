#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { chmodSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const executable = process.platform !== 'win32' ? resolve(__dirname, 'thrift') : resolve(__dirname, 'thrift.exe');
chmodSync(executable, '755');

const args = process.argv.slice(2);
spawn(executable, args, {
    stdio: 'inherit',
}).on('close', (code) => {
    process.exit(code);
});
