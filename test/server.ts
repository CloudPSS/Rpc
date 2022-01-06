import RoomService from './thrift/gen-nodejs/RoomService';
import * as RoomService2 from './thrift/gen-nodejs/RoomService2';
import { createServer } from '../dist/cjs/index';
import type { ThriftServer } from '../src';
import { RoomInfo } from './thrift/gen-nodejs/room_types';
import { setTimeout } from 'timers/promises';

function pppbool(input: boolean): Promise<boolean> {
    return Promise.resolve(input);
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

server().listen(4000);
