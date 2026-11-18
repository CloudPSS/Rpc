#!/usr/bin/env node

import { runThrift } from './run-thrift.js';

runThrift(['-r', '--gen', 'js:ts,es6,node,bigint', ...process.argv.slice(2)]);
