/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsdoc/require-jsdoc */

/** A boolean value (true or false) */
export type Bool = boolean;
/** An 8-bit unsigned integer */
export type U8 = number;
/** An 8-bit signed integer */
export type I8 = number;
/** A 16-bit signed integer */
export type I16 = number;
/** A 32-bit signed integer */
export type I32 = number;
/** A 64-bit signed integer */
export type I64 = bigint;
/** A 64-bit floating point number */
export type Double = number;

export type List<T> = T[];
/** An UUID */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;
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
    [TType.bool]: Bool;
    [TType.i8]: I8;
    [TType.i16]: I16;
    [TType.i32]: I32;
    [TType.i64]: I64;
    [TType.double]: Double;
    [TType.binary]: string | Buffer;
    [TType.list]: List<TType>;
    [TType.map]: Map<TType, TType>;
    [TType.set]: Set<TType>;
}

export enum MessageType {
    call = 1,
    reply = 2,
    exception = 3,
    oneway = 4,
}
