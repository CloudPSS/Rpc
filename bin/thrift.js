#!/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const executable =
    process.platform !== 'win32' ? path.resolve(__dirname, 'thrift') : path.resolve(__dirname, 'thrift.exe');

spawn(executable, process.argv, {
    stdio: 'inherit',
}).on('close', (code) => {
    process.exit(code);
});
