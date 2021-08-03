import * as RoomService from './thrift/gen-nodejs/RoomService';
import { createServer, createClient, ThriftServer } from '../src';
import { RoomInfo } from './thrift/gen-nodejs/room_types';

function pppbool(input: boolean): Promise<boolean> {
    return Promise.resolve(input);
}

/** 创建 RPC 服务 */
export function server(): ThriftServer {
    const s = createServer().route('room', RoomService, {
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
    return s;
}

/** 创建 RPC 客户端 */
export async function client(): Promise<void> {
    const client = createClient({
        host: 'localhost',
        port: 4000,
    });
    const room = client.get('room', RoomService);
    try {
        const r = await room.create();
        await room.get(r.id);
        await room.update(r.id);
        await room.remove(r.id);
    } finally {
        client.destroy();
    }
}
