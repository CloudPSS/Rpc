import RoomService from './thrift/gen-nodejs/RoomService.js';
import * as RoomService2 from './thrift/gen-nodejs/RoomService2.js';
import { createServer } from '../dist/index.js';
import type { ThriftServer } from '../src/index.js';
import { RoomInfo } from './thrift/gen-nodejs/room_types.js';
import { setTimeout } from 'node:timers/promises';

/** pppbool */
async function pppbool(input: boolean): Promise<boolean> {
    console.log('pppbool start');
    await setTimeout(1000);
    console.log('pppbool end');
    return input;
}

/** 创建 RPC 服务 */
export function server(): ThriftServer {
    const s = createServer();
    let i = 0;
    s.route(RoomService, {
        async create() {
            const index = i++;
            console.log('create', index);
            await setTimeout(1000);
            console.log('create_end', index);
            return new RoomInfo();
        },
        get(_id) {
            return new RoomInfo();
        },
        remove(_id) {
            return;
        },
        update(_id) {
            return;
        },
        pppbool,
    });
    s.route('room2', RoomService2, {
        b(s) {
            console.log(s);
            return s;
        },
        create() {
            return new RoomInfo();
        },
        get(_id) {
            return new RoomInfo();
        },
        remove(_id) {
            return;
        },
        update(_id) {
            return;
        },
        pppbool,
    });
    s.on('error', console.error);
    return s;
}

const s = server().listen(4000);

process.on('SIGINT', () => {
    console.log('closing');
    s.close(() => console.log('closed'));
});
