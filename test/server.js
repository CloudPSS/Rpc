import { createServer as net } from 'net';
import { BufferedTransport } from '../dist/lib/transport/buffered.js';
import { BinaryProtocol } from '../dist/lib/protocol/binary.js';
import { inspectableRawMessage } from '../dist/lib/protocol/inspect.js';

function pppbool(input) {
    return Promise.resolve(input);
}
net((c) => {
    c.pipe(BinaryProtocol.default.createReader(), BufferedTransport.default.createReader()).on('data', (data) => {
        console.log('data', inspectableRawMessage(data));
    });
    c.on('error', (err) => {
        console.log('socket error', err);
    });
}).listen(4000);
