import { createServer, createConnection, Server, Socket } from 'node:net';

export function createSocketServer(): Server {
    const server = createServer((socket) => {
        socket.on('data', (data) => {
            console.log(data.toString());
        });
    });
    return server;
}

export function createSocketClient(): Socket {
    return createConnection({
        path: '',
    });
}
