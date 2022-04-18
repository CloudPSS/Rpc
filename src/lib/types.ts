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

export enum TType {
    bool,
    i8,
    i16,
    i32,
    i64,
    double,
    binary,
    struct,
    map,
    set,
    list,
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

export interface MessageHeader {
    name: string;
    type: MessageType;
    seqId: I32;
}

export interface StructHeader {
    name: string;
}

export interface FieldHeader {
    name: string;
    type: TType;
    id: I16;
}

export interface MapHeader {
    keyType: TType;
    valueType: TType;
    size: I32;
}

export interface ListHeader {
    elementType: TType;
    size: I32;
}

export interface SetHeader {
    elementType: TType;
    size: I32;
}
