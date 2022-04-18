import { ApplicationException, ApplicationExceptionType } from '../error/application-exception';
import type { TransportReader, TransportWriter } from '../transport/interface';
import {
    FieldHeader,
    I8,
    ListHeader,
    MapHeader,
    MessageHeader,
    MessageType,
    SetHeader,
    StructHeader,
    TType,
} from '../types';
import { decode, encode } from '../utils/string';
import type { Protocol, ProtocolReader, ProtocolWriter } from './interface';

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
};

class BinaryProtocolReader implements ProtocolReader {
    constructor(private readonly transport: TransportReader, readonly strict: boolean) {}
    readMessageBegin(): MessageHeader {
        // TODO: this method is not atomic
        const buf = this.transport.peek(4);
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
            this.transport.skip(4);
            name = this.readString();
            seqId = this.readI32();
        } else {
            // version == 0
            if (this.strict) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidProtocol,
                    'Unsupported binary protocol version: 0',
                );
            }
            name = this.readString();
            type = this.readI8();
            seqId = this.readI32();
        }
        return { name, type, seqId };
    }
    readMessageEnd(): void {
        this.transport.end();
    }
    readStructBegin(): StructHeader {
        return { name: '' };
    }
    readStructEnd(): void {
        // noop
    }
    readFieldBegin(): FieldHeader | null {
        const buf0 = this.transport.peekByte();
        if (buf0 === STOP_FIELD) {
            this.transport.skip(1);
            return null;
        }
        const buf = this.transport.read(3);
        return {
            name: '',
            type: FieldTypeToTType[buf[1]],
            id: buf.readInt16BE(1),
        };
    }
    readFieldEnd(): void {
        // noop
    }
    readMapBegin(): MapHeader {
        const buf = this.transport.read(6);
        return {
            keyType: FieldTypeToTType[buf[0]],
            valueType: FieldTypeToTType[buf[1]],
            size: buf.readInt32BE(2),
        };
    }
    readMapEnd(): void {
        // noop
    }
    readListBegin(): ListHeader {
        const buf = this.transport.read(5);
        return {
            elementType: FieldTypeToTType[buf[0]],
            size: buf.readInt32BE(1),
        };
    }
    readListEnd(): void {
        // noop
    }
    readSetBegin(): SetHeader {
        const buf = this.transport.read(5);
        return {
            elementType: FieldTypeToTType[buf[0]],
            size: buf.readInt32BE(1),
        };
    }
    readSetEnd(): void {
        // noop
    }
    readBool(): boolean {
        return this.transport.readByte() !== 0;
    }
    readI8(): number {
        const buf = this.transport.read(1);
        return buf.readInt8(0);
    }
    readI16(): number {
        const buf = this.transport.read(2);
        return buf.readInt16BE(0);
    }
    readI32(): number {
        const buf = this.transport.read(4);
        return buf.readInt32BE(0);
    }
    readI64(): bigint {
        const buf = this.transport.read(8);
        return buf.readBigInt64BE(0);
    }
    readDouble(): number {
        const buf = this.transport.read(8);
        return buf.readDoubleBE(0);
    }
    readString(): string {
        const buf = this.readBinary();
        return decode(buf);
    }
    readBinary(): Uint8Array {
        const lenBuf = this.transport.peek(4);
        const len = lenBuf.readInt32BE(0);
        if (len < 0) {
            throw new ApplicationException(ApplicationExceptionType.protocolError, 'Negative binary length');
        }
        const buf = this.transport.read(4 + len);
        return Uint8Array.prototype.slice.call(buf, 4);
    }
}
class BinaryProtocolWriter implements ProtocolWriter {
    constructor(private readonly transport: TransportWriter, readonly strict: boolean) {}
    writeMessageBegin(name: string, type: MessageType, seqId: number): void {
        if (this.strict) {
            this.writeU16(VERSION_1);
            this.transport.writeByte(0);
            this.writeI8(type);
            this.writeString(name);
            this.writeI32(seqId);
        } else {
            this.writeString(name);
            this.writeI8(type);
            this.writeI32(seqId);
        }
    }
    writeMessageEnd(): void {
        this.transport.end();
    }
    writeStructBegin(name: string): void {
        void name;
        // noop
    }
    writeStructEnd(): void {
        this.transport.writeByte(STOP_FIELD);
    }
    writeFieldBegin(name: string, type: TType, id: number): void {
        void name;
        this.transport.writeByte(TTypeToFieldType[type]);
        this.writeI16(id);
    }
    writeFieldEnd(): void {
        // noop
    }
    writeMapBegin(keyType: TType, valType: TType, size: number): void {
        this.transport.writeByte(TTypeToFieldType[keyType]);
        this.transport.writeByte(TTypeToFieldType[valType]);
        this.writeI32(size);
    }
    writeMapEnd(): void {
        // noop
    }
    writeListBegin(elemType: TType, size: number): void {
        this.transport.writeByte(TTypeToFieldType[elemType]);
        this.writeI32(size);
    }
    writeListEnd(): void {
        // noop
    }
    writeSetBegin(elemType: TType, size: number): void {
        this.transport.writeByte(TTypeToFieldType[elemType]);
        this.writeI32(size);
    }
    writeSetEnd(): void {
        // noop
    }
    writeBool(value: boolean): void {
        this.transport.writeByte(value ? 1 : 0);
    }
    writeI8(value: number): void {
        this.transport.writeByte(value);
    }
    writeI16(value: number): void {
        const buf = Buffer.allocUnsafe(2);
        buf.writeInt16BE(value, 0);
        this.transport.write(buf);
    }
    writeU16(value: number): void {
        const buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(value, 0);
        this.transport.write(buf);
    }
    writeI32(value: number): void {
        const buf = Buffer.allocUnsafe(4);
        buf.writeInt32BE(value, 0);
        this.transport.write(buf);
    }
    writeI64(value: bigint): void {
        const buf = Buffer.allocUnsafe(8);
        buf.writeBigInt64BE(value, 0);
        this.transport.write(buf);
    }
    writeDouble(value: number): void {
        const buf = Buffer.allocUnsafe(8);
        buf.writeDoubleBE(value, 0);
        this.transport.write(buf);
    }
    writeString(value: string): void {
        const encoded = encode(value);
        this.writeBinary(encoded);
    }
    writeBinary(value: Uint8Array): void {
        this.writeI32(value.length);
        this.transport.write(value);
    }
}

export class BinaryProtocol implements Protocol {
    constructor(readonly strictRead: boolean = false, readonly strictWrite: boolean = true) {}
    createReader(transport: TransportReader): BinaryProtocolReader {
        return new BinaryProtocolReader(transport, this.strictRead);
    }
    createWriter(transport: TransportWriter): BinaryProtocolWriter {
        return new BinaryProtocolWriter(transport, this.strictWrite);
    }

    static readonly default = new BinaryProtocol();
}
