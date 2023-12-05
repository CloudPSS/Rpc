import * as RoomService from './thrift/gen-nodejs/RoomService.js';
import { createClient } from 'rpc-legacy';

/** 创建 RPC 客户端 */
export async function client() {
    const client = createClient({
        host: 'localhost',
        port: 4000,
    });
    client.on('error', (err) => console.error('client error', err));
    client.on('close', () => console.log('client close'));
    try {
        const room = client.get(RoomService);
        console.log(room);
        for (let index = 0; index < 100; index++) {
            console.log('create', index);
            room.create().finally(() => console.log('create_end', index));
        }
        room.pppbool(false);
        room.get('123');
        // const r = await room.create();
        // console.log(r);
        // await room.get(r.id);
        // await room.update(r.id);
        // await room.remove(r.id);

        // const room2 = client.get('room2', RoomService2);
        // room2.b(Buffer.allocUnsafe(100));
        // const buffer = Buffer.allocUnsafe(100_000_000);
        // for (let index = 0; index < buffer.length; index++) {
        //     buffer[index] = index;
        // }
        // console.time();
        // console.log(await room2.b(buffer));
        // console.timeEnd();
    } catch (ex) {
        console.error('error', ex);
    } finally {
        // console.log('destroy');
        // client.destroy();
    }
}

client();
