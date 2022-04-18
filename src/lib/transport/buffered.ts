import { DrainError } from '../error/stream';
import type { Transport, TransportReader, TransportWriter } from './interface';

const BUFFER_INIT_SIZE = 8 * 1024;
const BUFFER_REDUCE_THRESHOLD = 16 * 1024;
const BUFFER_RESIZE_FACTOR = 1.5;

class BufferedTransportReader implements TransportReader {
    private buffer = Buffer.allocUnsafe(BUFFER_INIT_SIZE);
    private requireSize = 0;
    private readPos = 0;
    private writePos = 0;
    /** Not enough bytes */
    private drain(requireSize: number): never {
        this.requireSize = requireSize;
        this.setReadyCallback();
        throw new DrainError();
    }

    private onData = (chunk: Buffer): void => {
        if (this.writePos + chunk.byteLength > this.buffer.length) {
            const newBuffer = Buffer.allocUnsafe(
                this.writePos + chunk.byteLength + this.buffer.length * (BUFFER_RESIZE_FACTOR - 1),
            );
            this.buffer.copy(newBuffer, 0, 0, this.writePos);
            this.buffer = newBuffer;
        }
        chunk.copy(this.buffer, this.writePos);
        this.writePos += chunk.byteLength;
        if (this.writePos - this.readPos > this.requireSize) {
            this.onReady();
        }
    };
    constructor(private readonly stream: NodeJS.ReadableStream) {
        stream.on('data', this.onData);
    }

    /** Set `ready` and `onReady` callback */
    private setReadyCallback(): void {
        if (this.ready != null) {
            this.onReady();
        }
        this.ready = new Promise((resolve) => (this.onReady = resolve));
    }
    private onReady!: () => void;
    ready!: Promise<void>;
    /** Throw read bytes to reduce buffer size */
    private reduceBuffer(): void {
        const unread = this.writePos - this.readPos;
        const newSize =
            unread * BUFFER_RESIZE_FACTOR > BUFFER_INIT_SIZE ? unread * BUFFER_RESIZE_FACTOR : BUFFER_INIT_SIZE;
        const newBuf = Buffer.allocUnsafe(newSize);
        this.buffer.copy(newBuf, 0, this.readPos, this.writePos);
        this.buffer = newBuf;
        this.readPos = 0;
        this.writePos = unread;
    }
    ensure(size: number): boolean {
        return this.writePos - this.readPos >= size;
    }
    readByte(): number {
        const ret = this.peekByte();
        this.readPos += 1;
        return ret;
    }
    read(size: number): Buffer {
        const ret = this.peek(size);
        this.readPos += size;
        if (this.readPos > BUFFER_REDUCE_THRESHOLD) {
            this.reduceBuffer();
        }
        return ret;
    }
    peekByte(): number {
        if (this.readPos >= this.writePos) {
            this.drain(1);
        }
        return this.buffer[this.readPos];
    }
    peek(size: number): Buffer {
        if (this.readPos + size > this.writePos) {
            this.drain(this.readPos + size - this.writePos);
        }
        return this.buffer.slice(this.readPos, this.readPos + size);
    }
    peekAll(): Buffer {
        return this.buffer.slice(this.readPos, this.writePos);
    }
    skip(size: number): void {
        if (this.readPos + size > this.writePos) {
            this.drain(this.readPos + size - this.writePos);
        }
        this.readPos += size;
        if (this.readPos > BUFFER_REDUCE_THRESHOLD) {
            this.reduceBuffer();
        }
    }
    end(): void {
        this.reduceBuffer();
    }
    destroy(): void {
        this.stream.off('data', this.onData);
    }
}
class BufferedTransportWriter implements TransportWriter {
    constructor(private readonly stream: NodeJS.WritableStream) {}
    write(data: Uint8Array): void {
        this.stream.write(data);
    }
    writeByte(data: number): void {
        const buf = Buffer.allocUnsafe(1);
        buf[0] = data;
        this.stream.write(buf);
    }
    end(): void {
        // noop
    }
    destroy(): void {
        this.stream.end();
    }
}

export class BufferedTransport implements Transport {
    createReader(readable: NodeJS.ReadableStream): TransportReader {
        return new BufferedTransportReader(readable);
    }
    createWriter(writable: NodeJS.WritableStream): TransportWriter {
        return new BufferedTransportWriter(writable);
    }

    static readonly default = new BufferedTransport();
}
