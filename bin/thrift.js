#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const { chmodSync } = require('fs');

const executable =
    process.platform !== 'win32' ? path.resolve(__dirname, 'thrift') : path.resolve(__dirname, 'thrift.exe');
chmodSync(executable, '755');

const args = process.argv.slice(2);
spawn(executable, args, {
    stdio: 'inherit',
}).on('close', (code) => {
    process.exit(code);
});
