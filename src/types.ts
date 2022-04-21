/** Thrift bool */
export type TBool = boolean;
/** Thrift bool */
export function TBool(value: boolean): TBool {
    return !!value;
}
/** Thrift byte */
export type TByte = number;
/** Thrift byte */
export function TByte(value: number): TByte {
    return value & 0xff;
}
/** Thrift i8 */
export type TI8 = number;
/** Thrift i8 */
export function TI8(value: number): TI8 {
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i8 because it is not an integer`);
    if (value < -128 || value > 127) throw new RangeError(`i8 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i16 */
export type TI16 = number;
/** Thrift i16 */
export function TI16(value: number): TI16 {
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i16 because it is not an integer`);
    if (value < -32768 || value > 32767) throw new RangeError(`i16 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i32 */
export type TI32 = number;
/** Thrift i32 */
export function TI32(value: number): TI32 {
    if (!Number.isInteger(value))
        throw new RangeError(`The number ${value} cannot be converted to an i32 because it is not an integer`);
    if (value < -2147483648 || value > 2147483647) throw new RangeError(`i32 out of range: ${value}`);
    return Math.trunc(value);
}
/** Thrift i64 */
export type TI64 = bigint;
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
export function TDouble(value: number): TDouble {
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
    if (Buffer.isBuffer(value)) {
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
/** Thrift map constructor */
export type TMapConstructor<K, V, T extends TMap<K, V>> = {
    new (): T;
    new (iterable?: Iterable<readonly [K, V]> | null): T;
} & {
    [k in keyof typeof TMap]: typeof TMap[k];
};

/** Thrift set */
export type TSet<K> = Set<K>;
/** Thrift set */
export const TSet = Set;
/** Thrift set constructor */
export type TSetConstructor<K, T extends TSet<K>> = {
    new (): T;
    new (iterable?: Iterable<K> | null): T;
} & {
    [k in keyof typeof TSet]: typeof TSet[k];
};

/** Thrift list */
export type TList<E> = E[];
/** Thrift list */
export const TList = Array;
/** Thrift list constructor */
export type TListConstructor<E, T extends TList<E>> = {
    new (arrayLength?: number): T;
    new (...items: E[]): T;
    /**
     * Creates an array from an iterable object.
     *
     * @param iterable An iterable object to convert to an array.
     */
    from(iterable: Iterable<E> | ArrayLike<E>): T;
    /**
     * Creates an array from an iterable object.
     *
     * @param iterable An iterable object to convert to an array.
     * @param mapfn A mapping function to call on every element of the array.
     * @param thisArg Value of 'this' used to invoke the mapfn.
     */
    from<O>(iterable: Iterable<O> | ArrayLike<O>, mapfn: (v: O, k: number) => E, thisArg?: unknown): T;
    /**
     * Returns a new array from a set of elements.
     *
     * @param items A set of elements to include in the new array object.
     */
    of(...items: E[]): T;
} & {
    [k in Exclude<keyof typeof TList, 'from' | 'of'>]: typeof TList[k];
};

/** Get required data to construct value */
export type TData<T> = T extends abstract new (data: infer U) => unknown
    ? U
    : T extends (data: infer U) => unknown
    ? U
    : T extends Set<infer K>
    ? T | Iterable<K>
    : T extends Map<infer K, infer V>
    ? T | Iterable<readonly [K, V]>
    : T extends Array<infer V>
    ? T | Iterable<V> | ArrayLike<V>
    : T;

/** Base class for thrift exceptions */
export abstract class TException extends Error {
    constructor() {
        super();
        this.name = new.target.name;
    }
    static serialize(value: TException): Uint8Array {
        throw new Error('Not implemented');
    }
    static deserialize(data: Uint8Array): TException {
        throw new Error('Not implemented');
    }
}

/** Base class for thrift structs */
export abstract class TStruct {
    static serialize(value: TStruct): Uint8Array {
        throw new Error('Not implemented');
    }
    static deserialize(data: TStruct): TException {
        throw new Error('Not implemented');
    }
}

/** Base class for thrift unions */
export abstract class TUnion {
    static serialize(value: TUnion): Uint8Array {
        throw new Error('Not implemented');
    }
    static deserialize(data: TUnion): TException {
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
