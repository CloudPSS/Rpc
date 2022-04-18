import RoomService from './thrift/gen-nodejs/RoomService.js';
import * as RoomService2 from './thrift/gen-nodejs/RoomService2.js';
import { createServer } from '../dist/index.js';
import { RoomInfo } from './thrift/gen-nodejs/room_types.js';
import { setTimeout } from 'timers/promises';
import { TJSONProtocol } from 'thrift';
import { createServer as net } from 'net';

function pppbool(input) {
    return Promise.resolve(input);
}

/** 创建 RPC 服务 */
export function server() {
    const s = createServer({
        protocol: TJSONProtocol,
    });
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

//server().listen(4000);
net((c) => {
    c.on('data', (d) => console.log(JSON.stringify(d.toString())));
}).listen(4000);
