import type { Transform } from 'node:stream';
import { type FrameData, FrameEnd } from '../transport/interface.js';
import type { Double, Bool, I16, I32, I64, I8, MessageType, TType, UUID } from '../types.js';

export type { FrameData };
export { FrameEnd };

/** Raw values */
export type RawValue =
    | Bool
    | I8
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    | I16
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    | I32
    | I64
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    | Double
    | Uint8Array
    | RawStruct
    | RawList
    | RawMap
    | UUID;

/** Raw field data */
export type RawField = [id: number, name: string, type: TType, value: RawValue];
/** Raw struct data */
export type RawStruct = [name: string, fields: RawField[]];
/** Raw list data */
export type RawList = [elementType: TType, elements: RawValue[]];
/** Raw map data */
export type RawMap = [keyType: TType, valueType: TType, keys: RawValue[], values: RawValue[]];

/** Raw message data */
export type RawMessage = [
    /** the message type */
    type: MessageType,
    /** the sequence id */
    seq: number,
    /** the method name */
    name: string,
    /** message data */
    data: RawStruct,
];

/** Read data from underlying transport, consume {@link FrameData}, generate {@link RawMessage} */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProtocolReader extends Transform {}

/** Write data to underlying stream, consume {@link RawMessage}, generate {@link FrameData} */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProtocolWriter extends Transform {}

/** Protocol */
export interface Protocol {
    /** Create protocol reader */
    createReader(): ProtocolReader;
    /** Create protocol writer */
    createWriter(): ProtocolWriter;
}
