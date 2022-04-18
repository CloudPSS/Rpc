import type { ProtocolReader, ProtocolWriter } from './protocol/interface';

export interface MessageReader<T> {
    read(): T | null;
}
export interface MessageWriter<T> {
    write(data: T): void;
}

export interface MessageSerializer<T> {
    validate(data: unknown): data is T;
    createReader(protocol: ProtocolReader): MessageReader<T>;
    createWriter(protocol: ProtocolWriter): MessageWriter<T>;
}
