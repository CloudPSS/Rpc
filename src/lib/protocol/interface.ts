import type { MessageType, TType, UUID } from '../types.js';

/** Message header data */
export type MessageHeader = [
    /** the message type */
    type: MessageType,
    /** the sequence id */
    seq: number,
    /** the method name */
    name: string,
];
/** Struct header data */
export type StructHeader = [name: string];
/** Field header data */
export type FieldHeader = [id: number, name: string, type: TType];
/** List header data */
export type ListHeader = [elementType: TType, size: number];
/** Map header data */
export type MapHeader = [keyType: TType, valueType: TType, size: number];
/**
 * Represents an abstract class for reading protocol data.
 */
export abstract class ProtocolReader {
    constructor(data: ArrayBufferView) {
        this.data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        this.length = data.byteLength;
        this.position = 0;
    }
    /** Data for reading */
    readonly data: Uint8Array;
    /** Data view for reading */
    readonly view: DataView;
    /** Length of data */
    readonly length: number;
    /** Current read position */
    protected position = 0;
    /** Ensures the reader has at least `size` bytes */
    protected ensureData(size: number): void {
        if (this.position + size > this.length) {
            throw new Error('Unexpected end of data');
        }
    }

    /**
     * Abstract method to read the message header.
     * @returns The message header data.
     */
    abstract readMessageHeader(): MessageHeader;

    /**
     * Abstract method to read the struct header.
     * @returns The struct header data.
     */
    abstract readStructHeader(): StructHeader;

    /**
     * Abstract method to read the field header.
     * @returns The field header data, or undefined if there are no more fields.
     */
    abstract readFieldHeader(): FieldHeader | undefined;

    /**
     * Abstract method to read the map header.
     * @returns The map header data.
     */
    abstract readMapHeader(): MapHeader;

    /**
     * Abstract method to read the list header.
     * @returns The list header data.
     */
    abstract readListHeader(): ListHeader;

    /**
     * Abstract method to read a boolean value.
     * @returns The boolean value.
     */
    abstract readBool(): boolean;

    /**
     * Abstract method to read an 8-bit integer value.
     * @returns The 8-bit integer value.
     */
    abstract readI8(): number;

    /**
     * Abstract method to read a 16-bit integer value.
     * @returns The 16-bit integer value.
     */
    abstract readI16(): number;

    /**
     * Abstract method to read a 32-bit integer value.
     * @returns The 32-bit integer value.
     */
    abstract readI32(): number;

    /**
     * Abstract method to read a 64-bit integer value.
     * @returns The 64-bit integer value.
     */
    abstract readI64(): bigint;

    /**
     * Abstract method to read a double value.
     * @returns The double value.
     */
    abstract readDouble(): number;

    /**
     * Abstract method to read a string value.
     * @returns The string value.
     */
    abstract readString(): string;

    /**
     * Abstract method to read a binary value.
     * @returns The binary value.
     */
    abstract readBinary(): Uint8Array;

    /**
     * Abstract method to read a UUID value.
     * @returns The UUID value.
     */
    abstract readUuid(): UUID;
}

export const CHUNK_SIZE = 64 * 1024;
/**
 * Represents a callback function used by the ProtocolWriter.
 * @param data - The data to be written.
 * @param done - Indicates whether the writing is complete.
 */
export type ProtocolWriterCallback = (data: Uint8Array, done: boolean) => unknown;
/**
 * Represents a protocol writer for writing data.
 */
export abstract class ProtocolWriter {
    constructor(private readonly callback: ProtocolWriterCallback) {
        this.data = new Uint8Array(CHUNK_SIZE);
        this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
        this.length = this.data.byteLength;
        this.position = 0;
    }
    /** Data for writing */
    protected data: Uint8Array;
    /** Data view for writing */
    protected view: DataView;
    /** Length of data */
    protected length: number;
    /** Current write position */
    protected position = 0;
    /** Ensures the writer has at least `size` bytes */
    protected ensureCapacity(size: number): void {
        if (this.position + size <= this.length) return;
        this.callback(this.data.subarray(0, this.position), false);
        const newSize = Math.max(size * 2, this.length);
        if (newSize !== this.length) {
            const newData = new Uint8Array(newSize);
            this.data = newData;
            this.view = new DataView(newData.buffer, newData.byteOffset, newData.byteLength);
            this.length = newSize;
        }
        this.position = 0;
    }

    /** Send an external data chunk */
    protected send(data: ArrayBufferView): void {
        if (this.position) {
            this.callback(this.data.subarray(0, this.position), false);
            this.position = 0;
        }
        const chunk = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        this.callback(chunk, false);
    }

    /** Marks the completion of the current operation. */
    protected done(): void {
        this.callback(this.data.subarray(0, this.position), true);
        this.position = 0;
    }
    /**
     * Abstract method to write the message begin.
     * @param value - The message header data.
     */
    abstract writeMessageBegin(value: MessageHeader): void;

    /**
     * Abstract method to write the message end.
     */
    abstract writeMessageEnd(): void;

    /**
     * Abstract method to write the struct begin.
     * @param value - The struct header data.
     */
    abstract writeStructBegin(value: StructHeader): void;

    /**
     * Abstract method to write the struct end.
     */
    abstract writeStructEnd(): void;

    /**
     * Abstract method to write the map begin.
     * @param value - The map header data.
     */
    abstract writeMapBegin(value: MapHeader): void;

    /**
     * Abstract method to write the map end.
     */
    abstract writeMapEnd(): void;

    /**
     * Abstract method to write the list begin.
     * @param value - The list header data.
     */
    abstract writeListBegin(value: ListHeader): void;

    /**
     * Abstract method to write the list end.
     */
    abstract writeListEnd(): void;

    /**
     * Abstract method to write a boolean value.
     * @param value - The boolean value.
     */
    abstract writeBool(value: boolean): void;

    /**
     * Abstract method to write an 8-bit integer value.
     * @param value - The 8-bit integer value.
     */
    abstract writeI8(value: number): void;

    /**
     * Abstract method to write a 16-bit integer value.
     * @param value - The 16-bit integer value.
     */
    abstract writeI16(value: number): void;

    /**
     * Abstract method to write a 32-bit integer value.
     * @param value - The 32-bit integer value.
     */
    abstract writeI32(value: number): void;

    /**
     * Abstract method to write a 64-bit integer value.
     * @param value - The 64-bit integer value.
     */
    abstract writeI64(value: bigint): void;

    /**
     * Abstract method to write a double value.
     * @param value - The double value.
     */
    abstract writeDouble(value: number): void;

    /**
     * Abstract method to write a string value.
     * @param value - The string value.
     */
    abstract writeString(value: string): void;

    /**
     * Abstract method to write a binary value.
     * @param value - The binary value.
     */
    abstract writeBinary(value: Uint8Array): void;

    /**
     * Abstract method to write a UUID value.
     * @param uuid - The UUID value.
     */
    abstract writeUuid(uuid: UUID): void;
}

/** Protocol */
export interface Protocol {
    /** name of protocol */
    readonly name: string;
    /** Create protocol reader */
    createReader(data: Uint8Array): ProtocolReader;
    /** Create protocol writer */
    createWriter(callback: ProtocolWriterCallback): ProtocolWriter;
}
