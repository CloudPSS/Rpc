import * as RoomService from './thrift/gen-nodejs/RoomService';
import { createServer, createClient, ThriftServer } from '../src';
import { RoomInfo } from './thrift/gen-nodejs/room_types';

/** 创建 RPC 服务 */
export function server(): ThriftServer {
    return createServer().route('room', RoomService, {
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
    });
}

/** 创建 RPC 客户端 */
export async function client(): Promise<void> {
    const client = createClient({
        host: 'localhost',
        port: 14000,
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
