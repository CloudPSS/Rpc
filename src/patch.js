import { TBufferedTransport, TFramedTransport } from 'thrift';
import binary from 'thrift/lib/nodejs/lib/thrift/binary.js';

TBufferedTransport.receiver = function (callback, seqid) {
    const reader = new TBufferedTransport();

    return function (data) {
        if (reader.writeCursor + data.length > reader.inBuf.length) {
            const buf = Buffer.alloc((reader.writeCursor + data.length) * 2);
            reader.inBuf.copy(buf, 0, 0, reader.writeCursor);
            reader.inBuf = buf;
        }
        data.copy(reader.inBuf, reader.writeCursor, 0);
        reader.writeCursor += data.length;

        callback(reader, seqid);
    };
};

TFramedTransport.receiver = function (callback, seqid) {
    let chunks = [];
    let length = 0;

    /**
     * receive data from socket
     * @this {import('node:net').Socket}
     * @param {Buffer} data
     */
    return function (data) {
        chunks.push(data);
        length += data.byteLength;

        while (length >= 4) {
            // make sure we have at least 4 bytes in first chunk
            if (chunks[0].byteLength < 4) {
                chunks = [Buffer.concat(chunks)];
            }
            // get single package sieze
            const frameSize = binary.readI32(chunks[0], 0);
            if (frameSize < 0) {
                this.emit('error', new Error('Read a negative frame size (' + frameSize + ')'));
                return;
            }
            // Not enough bytes to continue, save and resume on next packet
            if (length < 4 + frameSize) {
                return;
            }

            // extract frame
            if (chunks.length > 1) {
                chunks = [Buffer.concat(chunks)];
            }
            const frame = chunks[0].subarray(4, 4 + frameSize);
            length -= 4 + frameSize;
            if (length === 0) {
                chunks = [];
            } else {
                chunks[0] = chunks[0].subarray(4 + frameSize);
            }

            // get package data
            callback(new TFramedTransport(frame), seqid);
        }
    };
};
