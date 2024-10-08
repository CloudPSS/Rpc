import RoomService from './thrift/gen-nodejs/RoomService.js';
import * as RoomService2 from './thrift/gen-nodejs/RoomService2.js';
import { createClient } from '../dist/index.js';
import { setTimeout } from 'node:timers/promises';

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
        for (let index = 0; index < 100; index++) {
            console.log('create', index);
            void room.create().finally(() => console.log('create_end', index));
        }
        const r = await room.create();
        console.log(r);
        await room.get(r.id);
        await room.update(r.id);
        await room.remove(r.id);

        const room2 = client.get('room2', RoomService2);
        const buffer = Buffer.allocUnsafe(100_000_000);
        for (let index = 0; index < buffer.length; index++) {
            buffer[index] = index;
        }
        console.time(`${buffer.byteLength} buffer echo`);
        console.log(await room2.b(buffer));
        console.timeEnd(`${buffer.byteLength} buffer echo`);
    } catch (ex) {
        console.error('error', ex);
    } finally {
        console.log('end');
        await client.end();
    }

    // let index = 0;
    // while (index < 10) {
    //     await setTimeout(1000);
    //     console.log(index++, await client.get(RoomService).pppbool(true));
    // }
    // console.log(client.end());
}

await client();
