/** Thrift bool */
export type TBool = boolean;
/** Thrift byte */
export type TByte = number;
/** Thrift i8 */
export type TI8 = number;
/** Thrift i16 */
export type TI16 = number;
/** Thrift i32 */
export type TI32 = number;
/** Thrift i64 */
export type TI64 = bigint;
/** Thrift double */
export type TDouble = number;
/** Thrift string */
export type TString = string;
/** Thrift binary */
export type TBinary = Uint8Array;

/** Get required data to construct value */
export type RequiredData<T> = T extends new (data: infer U) => unknown
    ? U
    : T extends Set<infer K>
    ? T | Iterable<K>
    : T extends Map<infer K, infer V>
    ? T | Iterable<readonly [K, V]>
    : T extends Array<infer V>
    ? T | Iterable<V> | ArrayLike<V>
    : T;

export interface Serializable {
    serialize(): Uint8Array;
    deserialize(data: Uint8Array): void;
}

/** Base class for thrift exceptions */
export abstract class TException extends Error implements Serializable {
    constructor() {
        super();
        this.name = new.target.name;
    }
    abstract serialize(): Uint8Array;
    abstract deserialize(data: Uint8Array): void;
}

/** Base class for thrift structs */
export abstract class TStruct implements Serializable {
    abstract serialize(): Uint8Array;
    abstract deserialize(data: Uint8Array): void;
}

/** Base class for thrift unions */
export abstract class TUnion implements Serializable {
    abstract serialize(): Uint8Array;
    abstract deserialize(data: Uint8Array): void;
}
