/** Thrift bool */
export type TBool = boolean;
/** Thrift bool */
export function TBool(value: boolean): TBool {
    return !!value;
}
/** Thrift byte */
export type TByte = number & { __ttype__?: 'byte' };
/** Thrift byte */
export function TByte(value: number | bigint): TByte {
    if (typeof value == 'number') return value & 0xff;
    return Number(value & 0xffn);
}
/** Thrift i8 */
export type TI8 = number & { __ttype__?: 'i8' };
/** Thrift i8 */
export function TI8(value: number | bigint): TI8 {
    value = Number(value);
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i8 because it is not an integer`);
    if (value < -128 || value > 127) throw new RangeError(`i8 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i16 */
export type TI16 = number & { __ttype__?: 'i16' };
/** Thrift i16 */
export function TI16(value: number | bigint): TI16 {
    value = Number(value);
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i16 because it is not an integer`);
    if (value < -32768 || value > 32767) throw new RangeError(`i16 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i32 */
export type TI32 = number & { __ttype__?: 'i32' };
/** Thrift i32 */
export function TI32(value: number | bigint): TI32 {
    value = Number(value);
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i32 because it is not an integer`);
    if (value < -2147483648 || value > 2147483647) throw new RangeError(`i32 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i64 */
export type TI64 = bigint & { __ttype__?: 'i64' };
/** Thrift i64 */
export function TI64(value: number | bigint | string): TI64 {
    value = BigInt(value);
    if (value < -9223372036854775808n || value > 9223372036854775807n)
        throw new RangeError(`i64 out of range: ${value}`);
    return value;
}
/** Thrift double */
export type TDouble = number;
/** Thrift double */
export function TDouble(value: number | bigint): TDouble {
    return Number(value);
}
/** Thrift string */
export type TString = string;
/** Thrift string */
export function TString(value: string): TString {
    return String(value);
}

const encoder = new TextEncoder();
/** Thrift binary */
export type TBinary = Uint8Array;
/** Thrift binary */
export function TBinary(value: Uint8Array | ArrayBuffer | string): TBinary {
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value);
    }
    if (typeof Buffer == 'function' && Buffer.isBuffer(value)) {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    if (typeof value === 'string') {
        return encoder.encode(value);
    }
    return value;
}

/** Thrift map */
export type TMap<K, V> = Map<K, V>;
/** Thrift map */
export const TMap = Map;

/** Thrift set */
export type TSet<K> = Set<K>;
/** Thrift set */
export const TSet = Set;

/** Thrift list */
export type TList<E> = E[];
/** Thrift list */
export const TList = Array;

/** Get required data to construct value */
export type TData<T> = T extends abstract new (data: infer U) => unknown
    ? U
    : T extends (data: infer U) => unknown
      ? U
      : T extends Set<infer K>
        ? T | Iterable<TData<K>>
        : T extends Map<infer K, infer V>
          ? T | Iterable<readonly [TData<K>, TData<V>]>
          : T extends Array<infer V>
            ? T | Iterable<TData<V>> | ArrayLike<TData<V>>
            : T;

export type TDeserializer<T> = Iterator<undefined, T, Uint8Array>;

/** Base class for thrift exceptions */
export abstract class TException extends Error {
    constructor() {
        super();
        this.name = new.target.name;
    }
    /**
     * 序列化，由子类实现
     */
    static serialize(value: TException): Uint8Array {
        throw new Error('Not implemented');
    }
    /**
     * 反序列化，由子类实现
     */
    static deserialize(): TDeserializer<TException> {
        throw new Error('Not implemented');
    }
}

/** Base class for thrift structs */
export abstract class TStruct {
    /**
     * 序列化，由子类实现
     */
    static serialize(value: TStruct): Uint8Array {
        throw new Error('Not implemented');
    }
    /**
     * 反序列化，由子类实现
     */
    static deserialize(): TDeserializer<TStruct> {
        throw new Error('Not implemented');
    }
}

/** Base class for thrift unions */
export abstract class TUnion {
    /**
     * 序列化，由子类实现
     */
    static serialize(value: TUnion): Uint8Array {
        throw new Error('Not implemented');
    }
    /**
     * 反序列化，由子类实现
     */
    static deserialize(): TDeserializer<TUnion> {
        throw new Error('Not implemented');
    }
}

/** Lifetime configuration of service */
export type ServiceLifetime = 'transient' | 'scoped' | 'singleton';

/** Base class for thrift services */
export abstract class TService {
    /** Lifetime configuration of service */
    static lifetime?: ServiceLifetime;
}
