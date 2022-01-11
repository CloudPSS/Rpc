import { TBufferedTransport } from 'thrift';

TBufferedTransport.receiver = function (callback, seqid) {
    var reader = new TBufferedTransport();

    return function (data) {
        if (reader.writeCursor + data.length > reader.inBuf.length) {
            var buf = Buffer.alloc((reader.writeCursor + data.length) * 2);
            reader.inBuf.copy(buf, 0, 0, reader.writeCursor);
            reader.inBuf = buf;
        }
        data.copy(reader.inBuf, reader.writeCursor, 0);
        reader.writeCursor += data.length;

        callback(reader, seqid);
    };
};
