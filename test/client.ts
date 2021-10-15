import RoomService from './thrift/gen-nodejs/RoomService';
import * as RoomService2 from './thrift/gen-nodejs/RoomService2';
import { createClient } from '../src';

/** 创建 RPC 客户端 */
export async function client(): Promise<void> {
    const client = createClient({
        host: 'localhost',
        port: 4000,
    });
    client.on('error', (err) => console.error('client error', err));
    client.on('close', () => console.log('client close'));
    try {
        const room = client.get(RoomService);
        console.log(room);
        const r = await room.create();
        console.log(r);
        await room.get(r.id);
        await room.update(r.id);
        await room.remove(r.id);

        const room2 = client.get('room2', RoomService2);
        const buffer = Buffer.alloc(256);
        for (let index = 0; index < buffer.length; index++) {
            buffer[index] = index;
        }
        console.log(await room2.b(buffer as unknown as string));
    } catch (ex) {
        console.error('error', ex);
    } finally {
        console.log('destroy');
        client.destroy();
    }
}

client();
