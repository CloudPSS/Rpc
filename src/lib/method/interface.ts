import type { Exception } from '../error/exception';
import type { ProtocolReader, ProtocolWriter } from '../protocol/interface';
import type { I16 } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Method = (...args: any[]) => unknown;
export type Service = Record<string, Method>;

export interface StructReader<T> {
    read(): boolean;
    result?: T;
}

export interface StructWriter<T> {
    write(value: T): void;
}
export interface StructSerializer<T> {
    validate(value: unknown): value is T;
    createReader(protocol: ProtocolReader): StructReader<T>;
    createWriter(protocol: ProtocolWriter): StructWriter<T>;
}

export interface MethodProcessor<T extends Method = Method> {
    args: StructSerializer<Parameters<T>>;
    result?: StructSerializer<{ success: Awaited<ReturnType<T>> } | { throws: Exception }>;
}
