import { PassThrough, Transform } from 'node:stream';
import net from 'node:net';
import tls from 'node:tls';
import { once } from 'node:events';
import type { FrameData, Transport, TransportStream } from './interface.js';

/** Options for Stream socket transport */
export type StreamTransportOptions = net.SocketConnectOpts & {
    tls?: Omit<tls.ConnectionOptions, 'host' | 'port' | 'path' | 'socket'> | boolean;
};

/** Stream socket transport, for UDS, TCP, TLS sockets. */
export class StreamTransport implements Transport {
    constructor(readonly options: StreamTransportOptions) {}
    /** @inheritdoc */
    async connect(): Promise<TransportStream> {
        let socket: net.Socket | tls.TLSSocket;
        let connect;
        const { tls: tlsOpt, ...opt } = this.options;
        if (tlsOpt) {
            const options = typeof tlsOpt == 'object' ? { ...opt, ...tlsOpt } : opt;
            socket = tls.connect(options);
            connect = 'secureConnect';
        } else {
            socket = net.connect(opt);
            connect = 'connect';
        }
        const connected = once(socket, connect);
        const error = once(socket, 'error').then(([err]) => Promise.reject(err));
        await Promise.race([connected, error]);
        return this.createWriter().pipe(socket).pipe(this.createReader());
    }
    /** @inheritdoc */
    async listen(onConnect: (stream: TransportStream) => void): Promise<() => Promise<void>> {
        let server;
        let connection;
        const { tls: tlsOpt, ...opt } = this.options as Omit<
            StreamTransportOptions,
            'path' | 'onread' | 'host' | 'port'
        >;
        if (tlsOpt) {
            const options = typeof tlsOpt == 'object' ? { ...opt, ...tlsOpt } : opt;
            server = tls.createServer(options);
            connection = 'secureConnection';
        } else {
            server = net.createServer(opt);
            connection = 'connection';
        }
        server.on(connection, (socket: net.Socket | tls.TLSSocket) => {
            onConnect(this.createWriter().pipe(socket).pipe(this.createReader()));
        });
        await once(server, 'listening');
        const s = server;
        return async () => {
            s.close();
            await once(s, 'close');
        };
    }
    /** reader transform */
    protected createReader(): Transform {
        return new PassThrough({
            encoding: 'utf8',
            defaultEncoding: 'utf8',
            readableObjectMode: false,
            writableObjectMode: false,
        });
    }
    /** writer transform */
    protected createWriter(): Transform {
        return new Transform({
            readableObjectMode: true,
            writableObjectMode: false,
            transform: (chunk: FrameData, _, callback) => {
                if (ArrayBuffer.isView(chunk)) {
                    callback(null, chunk);
                }
            },
        });
    }
}
