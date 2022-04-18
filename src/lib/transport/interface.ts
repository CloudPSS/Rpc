import type { U8 } from '../types';

export interface TransportReader {
    ready(size?: number): Promise<void>;
    read(size: number): Buffer;
    readByte(): U8;
    peek(size: number): Buffer;
    peekByte(): U8;
    peekAll(): Buffer;
    skip(size: number): void;
    /** Called by protocol when finished read a message */
    end(): void;
    destroy(): void;
}

export interface TransportWriter {
    write(data: Uint8Array): void;
    writeByte(data: U8): void;
    /** Called by protocol when finished write a message */
    end(): void;
    destroy(): void;
}

export interface Transport {
    createReader(readable: NodeJS.ReadableStream): TransportReader;
    createWriter(writable: NodeJS.WritableStream): TransportWriter;
}
