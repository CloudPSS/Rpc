/* eslint-disable @typescript-eslint/unbound-method */
import { Transform, type TransformCallback } from 'node:stream';
import { ApplicationException, ApplicationExceptionType } from '../error/application-exception.js';
import { MessageType, TType, type I8, type UUID } from '../types.js';
import { decode, encode } from '../utils/string.js';
import {
    type Protocol,
    type ProtocolReader,
    type ProtocolWriter,
    type RawList,
    type RawMap,
    type RawMessage,
    type RawStruct,
    FrameEnd,
    type RawValue,
    type RawField,
    type FrameData,
} from './interface.js';

const VERSION_1 = 0x8001;
const VERSION_MASK = 0x7fff;
const STOP_FIELD = 0;

const TTypeToFieldType: Record<TType, I8> = {
    [TType.bool]: 2,
    [TType.i8]: 3,
    [TType.double]: 4,
    [TType.i16]: 6,
    [TType.i32]: 8,
    [TType.i64]: 10,
    [TType.binary]: 11,
    [TType.struct]: 12,
    [TType.map]: 13,
    [TType.set]: 14,
    [TType.list]: 15,
    [TType.uuid]: 16,
};

const FieldTypeToTType: Record<I8, TType> = {
    [2]: TType.bool,
    [3]: TType.i8,
    [4]: TType.double,
    [6]: TType.i16,
    [8]: TType.i32,
    [10]: TType.i64,
    [11]: TType.binary,
    [12]: TType.struct,
    [13]: TType.map,
    [14]: TType.set,
    [15]: TType.list,
    [16]: TType.uuid,
};

/** yield [kConsume, size] => read and consume size byte buffer & returns Buffer(size) */
const kConsume = Symbol('consume');
/** yield [kPeek, size] => read size byte buffer & returns Buffer(size) */
const kPeek = Symbol('peek');
/** yield [kSkip, size] => skip size byte buffer & returns Buffer(0) */
const kSkip = Symbol('skip');
/** Request for buffer */
type BufferRequest = [action: typeof kConsume | typeof kPeek | typeof kSkip, size: number];
/** Buffer consumer */
type BufferConsumer<T> = Generator<BufferRequest, T, Buffer>;
const EMPTY_BUFFER = Buffer.allocUnsafe(0);

/** BinaryProtocolReader */
class BinaryProtocolReader extends Transform implements ProtocolReader {
    constructor(readonly strict: boolean) {
        super({ readableObjectMode: true, writableObjectMode: true });
        this.reset();
    }
    protected pending!: BufferRequest;
    protected running!: BufferConsumer<never>;
    /** buffered data */
    protected readonly buffer: FrameData[] = [];
    /** unread bytes in buffer, sum of {@link buffer} length */
    protected bufferUnread = 0;
    /** reset reader status */
    protected reset(): void {
        this.running = this.run();
        this.pending = this.running.next().value;
    }
    /** Ensures buffer[0] has at least `size` bytes */
    protected ensure(size: number): Buffer | undefined {
        if (size <= 0) return EMPTY_BUFFER;
        if (this.bufferUnread < size) {
            throw new ApplicationException(ApplicationExceptionType.protocolError, 'Buffer underflow');
        }
        const buf0 = this.buffer[0];
        if (!ArrayBuffer.isView(buf0)) {
            // bad status, reset reader
            this.buffer.shift();
            this.reset();
            return;
        }
        if (buf0.byteLength >= size) {
            return buf0;
        }
        const buf = [buf0];
        let len = buf0.byteLength;
        for (let i = 1; i < this.buffer.length; i++) {
            const next = this.buffer[i];
            if (!ArrayBuffer.isView(next)) {
                // bad status, reset reader
                this.buffer.splice(0, i + 1);
                this.reset();
                return;
            }
            buf.push(next);
            len += next.byteLength;
            if (len >= size) {
                const ret = Buffer.concat(buf);
                this.buffer.splice(0, i + 1, ret);
                return ret;
            }
        }
        throw new ApplicationException(ApplicationExceptionType.protocolError, 'Buffer underflow');
    }
    /** @inheritdoc */
    override _transform(chunk: FrameData, encoding: BufferEncoding, callback: TransformCallback): void {
        try {
            this.buffer.push(chunk);
            if (ArrayBuffer.isView(chunk)) {
                this.bufferUnread += chunk.byteLength;
            }
            while (this.bufferUnread >= this.pending[1]) {
                const [type, size] = this.pending;
                if (size <= 0) {
                    this.pending = this.running.next(EMPTY_BUFFER).value;
                    continue;
                }
                switch (type) {
                    case kConsume: {
                        const buffer = this.ensure(size);
                        if (!buffer) continue;
                        this.bufferUnread -= size;
                        this.buffer[0] = buffer.subarray(size);
                        this.pending = this.running.next(buffer.subarray(0, size)).value;
                        break;
                    }
                    case kPeek: {
                        const buffer = this.ensure(size);
                        if (!buffer) continue;
                        this.pending = this.running.next(buffer.subarray(0, size)).value;
                        break;
                    }
                    case kSkip: {
                        const buffer = this.ensure(size);
                        if (!buffer) continue;
                        this.bufferUnread -= size;
                        this.buffer[0] = buffer.subarray(size);
                        this.pending = this.running.next(EMPTY_BUFFER).value;
                        break;
                    }
                    default:
                        throw new ApplicationException(
                            ApplicationExceptionType.protocolError,
                            `Invalid request type: ${String(type)}`,
                        );
                }
            }
        } catch (e) {
            callback(e as Error);
            return;
        }
        callback();
    }
    /** @inheritdoc */
    override _flush(callback: TransformCallback): void {
        this.reset();
        callback();
    }
    /** read message */
    protected *run(): BufferConsumer<never> {
        while (true) {
            const ret = yield* this.readMessage();
            this.push(ret);
        }
    }
    /** get reader for type */
    protected reader(type: TType): (this: this) => BufferConsumer<RawValue> {
        switch (type) {
            case TType.bool:
                return this.readBool;
            case TType.i8:
                return this.readI8;
            case TType.i16:
                return this.readI16;
            case TType.i32:
                return this.readI32;
            case TType.i64:
                return this.readI64;
            case TType.double:
                return this.readDouble;
            case TType.binary:
                return this.readBinary;
            case TType.struct:
                return this.readStruct;
            case TType.map:
                return this.readMap;
            case TType.set:
            case TType.list:
                return this.readList;
            case TType.uuid:
                return this.readUuid;
            default:
                throw new ApplicationException(
                    ApplicationExceptionType.protocolError,
                    `Invalid type: ${String(type satisfies never)}`,
                );
        }
    }
    /** read message */
    protected *readMessage(): BufferConsumer<RawMessage> {
        const buf = yield [kPeek, 4];
        let name: string;
        let type: MessageType;
        let seqId: number;
        if (buf[0] & 0x80) {
            // version >= 1
            const version = buf.readUInt16BE(0) & VERSION_MASK;
            if (version !== 1) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidProtocol,
                    `Unsupported binary protocol version: ${version}`,
                );
            }
            type = buf[3] as MessageType;
            yield [kSkip, 4];
            name = yield* this.readString();
            seqId = yield* this.readI32();
        } else {
            // version == 0
            if (this.strict) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidProtocol,
                    'Unsupported binary protocol version: 0',
                );
            }
            name = yield* this.readString();
            type = yield* this.readI8();
            seqId = yield* this.readI32();
        }
        const struct = yield* this.readStruct();
        return [type, seqId, name, struct];
    }
    /** read message */
    protected *readStruct(): BufferConsumer<RawStruct> {
        const fields: RawField[] = [];
        while (true) {
            const type = (yield [kConsume, 1])[0];
            if (type === STOP_FIELD) {
                break;
            }
            const tType = FieldTypeToTType[type];
            const id = yield* this.readI16();
            const value = yield* this.reader(tType).call(this);
            fields.push([id, '', tType, value]);
        }
        return ['', fields];
    }
    /** read message */
    protected *readMap(): BufferConsumer<RawMap> {
        const buf = yield [kConsume, 6];
        const keyType = FieldTypeToTType[buf[0]];
        const valueType = FieldTypeToTType[buf[1]];
        const size = buf.readInt32BE(2);
        const keys: RawValue[] = [];
        const values: RawValue[] = [];
        const keyReader = this.reader(keyType);
        const valueReader = this.reader(valueType);
        for (let i = 0; i < size; i++) {
            keys.push(yield* keyReader.call(this));
            values.push(yield* valueReader.call(this));
        }
        return [keyType, valueType, keys, values];
    }
    /** read message */
    protected *readList(): BufferConsumer<RawList> {
        const buf = yield [kConsume, 5];
        const elementType = FieldTypeToTType[buf[0]];
        const size = buf.readInt32BE(1);
        const elements: RawValue[] = [];
        const reader = this.reader(elementType);
        for (let i = 0; i < size; i++) {
            elements.push(yield* reader.call(this));
        }
        return [elementType, elements];
    }
    /** read message */
    protected *readBool(): BufferConsumer<boolean> {
        const buf = yield [kConsume, 1];
        return buf[0] !== 0;
    }
    /** read message */
    protected *readI8(): BufferConsumer<number> {
        const buf = yield [kConsume, 1];
        return buf.readInt8(0);
    }
    /** read message */
    protected *readI16(): BufferConsumer<number> {
        const buf = yield [kConsume, 2];
        return buf.readInt16BE(0);
    }
    /** read message */
    protected *readI32(): BufferConsumer<number> {
        const buf = yield [kConsume, 4];
        return buf.readInt32BE(0);
    }
    /** read message */
    protected *readI64(): BufferConsumer<bigint> {
        const buf = yield [kConsume, 8];
        return buf.readBigInt64BE(0);
    }
    /** read message */
    protected *readDouble(): BufferConsumer<number> {
        const buf = yield [kConsume, 8];
        return buf.readDoubleBE(0);
    }
    /** read message */
    protected *readString(): BufferConsumer<string> {
        const buf = yield* this.readBinary();
        return decode(buf);
    }
    /** read message */
    protected *readBinary(): BufferConsumer<Uint8Array> {
        const len = yield* this.readI32();
        if (len < 0) {
            throw new ApplicationException(ApplicationExceptionType.protocolError, 'Negative binary length');
        }
        const buf = yield [kConsume, len];
        return buf;
    }
    /** read message */
    protected *readUuid(): BufferConsumer<UUID> {
        // UUID in big endian
        const buf = yield [kConsume, 16];
        return [
            buf.toString('hex', 0, 4),
            buf.toString('hex', 4, 6),
            buf.toString('hex', 6, 8),
            buf.toString('hex', 8, 10),
            buf.toString('hex', 10, 16),
        ].join('-') as UUID;
    }
}

/** BinaryProtocolWriter */
class BinaryProtocolWriter extends Transform implements ProtocolWriter {
    constructor(readonly strict: boolean) {
        super({ readableObjectMode: true, writableObjectMode: true });
    }
    /** @inheritdoc */
    override _transform(chunk: RawMessage, _: BufferEncoding, callback: TransformCallback): void {
        try {
            const [type, seq, name, data] = chunk;
            if (this.strict) {
                this.writeU16(VERSION_1);
                this.writeByte(0);
                this.writeI8(type);
                this.writeString(name);
                this.writeI32(seq);
            } else {
                this.writeString(name);
                this.writeI8(type);
                this.writeI32(seq);
            }
            this.writeStruct(data);
            this.write(FrameEnd);
        } catch (e) {
            callback(e as Error);
            return;
        }
        callback();
    }
    /** get writer for type */
    protected writer(type: TType): (this: this, value: never) => void {
        switch (type) {
            case TType.bool:
                return this.writeBool;
            case TType.i8:
                return this.writeI8;
            case TType.i16:
                return this.writeI16;
            case TType.i32:
                return this.writeI32;
            case TType.i64:
                return this.writeI64;
            case TType.double:
                return this.writeDouble;
            case TType.binary:
                return this.writeBinary;
            case TType.struct:
                return this.writeStruct;
            case TType.map:
                return this.writeMap;
            case TType.set:
            case TType.list:
                return this.writeList;
            case TType.uuid:
                return this.writeUuid;
            default: {
                throw new ApplicationException(
                    ApplicationExceptionType.protocolError,
                    `Invalid type: ${String(type satisfies never)}`,
                );
            }
        }
    }
    /** write message */
    protected writeStruct(value: RawStruct): void {
        const [, fields] = value;
        for (const [id, , type, value] of fields) {
            this.writeByte(TTypeToFieldType[type]);
            this.writeI16(id);
            const writer = this.writer(type);
            writer.call(this, value as never);
        }
        this.writeByte(STOP_FIELD);
    }
    /** write message */
    protected writeMap(value: RawMap): void {
        const [keyType, valueType, keys, values] = value;
        this.writeByte(TTypeToFieldType[keyType]);
        this.writeByte(TTypeToFieldType[valueType]);
        this.writeI32(keys.length);
        const keyWriter = this.writer(keyType);
        const valueWriter = this.writer(valueType);
        for (let i = 0; i < keys.length; i++) {
            keyWriter.call(this, keys[i] as never);
            valueWriter.call(this, values[i] as never);
        }
    }
    /** write message */
    protected writeList(value: RawList): void {
        const [elemType, elements] = value;
        this.writeByte(TTypeToFieldType[elemType]);
        this.writeI32(elements.length);
        const writer = this.writer(elemType);
        for (const element of elements) {
            writer.call(this, element as never);
        }
    }
    /** write message */
    protected writeBool(value: boolean): void {
        this.writeByte(value ? 1 : 0);
    }
    /** write message */
    protected writeI8(value: number): void {
        this.writeByte(value);
    }
    /** write message */
    protected writeI16(value: number): void {
        const buf = Buffer.allocUnsafe(2);
        buf.writeInt16BE(value, 0);
        this.write(buf);
    }
    /** write message */
    protected writeU16(value: number): void {
        const buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(value, 0);
        this.write(buf);
    }
    /** write message */
    protected writeI32(value: number): void {
        const buf = Buffer.allocUnsafe(4);
        buf.writeInt32BE(value, 0);
        this.write(buf);
    }
    /** write message */
    protected writeI64(value: bigint): void {
        const buf = Buffer.allocUnsafe(8);
        buf.writeBigInt64BE(value, 0);
        this.write(buf);
    }
    /** write message */
    protected writeDouble(value: number): void {
        const buf = Buffer.allocUnsafe(8);
        buf.writeDoubleBE(value, 0);
        this.write(buf);
    }
    /** write message */
    protected writeString(value: string): void {
        this.writeBinary(encode(value));
    }
    /** write message */
    protected writeBinary(value: Uint8Array): void {
        this.writeI32(value.length);
        this.write(value);
    }
    /** write message */
    protected writeByte(byte: number): void {
        this.write(Buffer.from([byte]));
    }
    /** write message */
    protected writeUuid(uuid: UUID): void {
        const [a, b, c, d, e] = uuid.split('-');
        const buf = Buffer.allocUnsafe(16);
        buf.write(a, 0, 4, 'hex');
        buf.write(b, 4, 2, 'hex');
        buf.write(c, 6, 2, 'hex');
        buf.write(d, 8, 2, 'hex');
        buf.write(e, 10, 6, 'hex');
        this.write(buf);
    }
}

/** Binary protocol */
export class BinaryProtocol implements Protocol {
    constructor(
        readonly strictRead = false,
        readonly strictWrite = true,
    ) {}
    /** @inheritdoc */
    createReader(): BinaryProtocolReader {
        return new BinaryProtocolReader(this.strictRead);
    }
    /** @inheritdoc */
    createWriter(): BinaryProtocolWriter {
        return new BinaryProtocolWriter(this.strictWrite);
    }

    static readonly default = new BinaryProtocol();
}
