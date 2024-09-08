export type { UUID } from '@cloudpss/id';

export enum TType {
    bool = 2,
    i8 = 3,
    i16 = 6,
    i32 = 8,
    i64 = 10,
    double = 4,
    binary = 11,
    struct = 12,
    map = 13,
    set = 14,
    list = 15,
    uuid = 16,
}

/** Map types to TType */
export interface TTypeMap {
    /** boolean */
    [TType.bool]: boolean;
    /** 8-bit integer */
    [TType.i8]: number;
    /** 16-bit integer */
    [TType.i16]: number;
    /** 32-bit integer */
    [TType.i32]: number;
    /** 64-bit integer */
    [TType.i64]: bigint;
    /** double */
    [TType.double]: number;
    /** binary */
    [TType.binary]: string | Uint8Array;
    /** list */
    [TType.list]: TType[];
    /** map */
    [TType.map]: Map<TType, TType>;
    /** set */
    [TType.set]: Set<TType>;
}

export enum MessageType {
    call = 1,
    reply = 2,
    exception = 3,
    oneway = 4,
}
