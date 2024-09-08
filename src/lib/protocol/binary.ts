import { serializeUUID, deserializeUUIDInto } from '@cloudpss/id';
import { ApplicationException, ApplicationExceptionType } from '../error/application-exception.js';
import type { MessageType, UUID } from '../types.js';
import { decode, encode } from '../utils/string.js';
import {
    ProtocolReader,
    ProtocolWriter,
    type Protocol,
    type MessageHeader,
    type FieldHeader,
    type StructHeader,
    type MapHeader,
    type ListHeader,
    CHUNK_SIZE,
} from './interface.js';

const VERSION_1 = 0x8001;
const VERSION_MASK = 0x7fff;
const VERSION_TYPE_MASK = 0x8000;
const STOP_FIELD = 0;

/** BinaryProtocolReader */
class BinaryProtocolReader extends ProtocolReader {
    /** @inheritdoc */
    readMessageHeader(): MessageHeader {
        this.ensureData(4);
        const versionData = this.view.getUint16(this.position);
        if (!(versionData & VERSION_TYPE_MASK)) {
            // version == 0
            throw new ApplicationException(
                ApplicationExceptionType.invalidProtocol,
                'Unsupported binary protocol version: 0',
            );
        }
        const version = versionData & VERSION_MASK;
        if (version !== 1) {
            throw new ApplicationException(
                ApplicationExceptionType.invalidProtocol,
                `Unsupported binary protocol version: ${version}`,
            );
        }
        const type = this.data[this.position + 3] as MessageType;
        this.position += 4;
        const name = this.readString();
        const seq = this.readI32();
        return [type, seq, name];
    }
    /** Do nothing in binary protocol */
    readStructHeader(): StructHeader {
        this.ensureData(1);
        return [''];
    }
    /** @inheritdoc */
    readFieldHeader(): FieldHeader | undefined {
        this.ensureData(1);
        const type = this.data[this.position++]!;
        if (type === STOP_FIELD) return undefined;
        const id = this.readI16();
        return [id, '', type];
    }
    /** @inheritdoc */
    readMapHeader(): MapHeader {
        this.ensureData(6);
        const keyType = this.data[this.position++]!;
        const valueType = this.data[this.position++]!;
        const size = this.readI32();
        return [keyType, valueType, size];
    }
    /** @inheritdoc */
    readListHeader(): ListHeader {
        this.ensureData(5);
        const elementType = this.data[this.position++]!;
        const size = this.readI32();
        return [elementType, size];
    }
    /** @inheritdoc */
    readBool(): boolean {
        this.ensureData(1);
        const byte = this.data[this.position]!;
        this.position += 1;
        return !!byte;
    }
    /** @inheritdoc */
    readI8(): number {
        this.ensureData(1);
        const value = this.view.getInt8(this.position);
        this.position += 1;
        return value;
    }
    /** @inheritdoc */
    readI16(): number {
        this.ensureData(2);
        const value = this.view.getInt16(this.position);
        this.position += 2;
        return value;
    }
    /** @inheritdoc */
    readI32(): number {
        this.ensureData(4);
        const value = this.view.getInt32(this.position);
        this.position += 4;
        return value;
    }
    /** @inheritdoc */
    readI64(): bigint {
        this.ensureData(8);
        const value = this.view.getBigInt64(this.position);
        this.position += 8;
        return value;
    }
    /** @inheritdoc */
    readDouble(): number {
        this.ensureData(8);
        const value = this.view.getFloat64(this.position);
        this.position += 8;
        return value;
    }
    /** @inheritdoc */
    readString(): string {
        const buf = this.readBinary();
        return decode(buf);
    }
    /** @inheritdoc */
    readBinary(): Uint8Array {
        const len = this.readI32();
        if (len < 0) {
            throw new ApplicationException(ApplicationExceptionType.protocolError, 'Negative binary length');
        }
        this.ensureData(len);
        const buf = this.data.subarray(this.position, this.position + len);
        this.position += len;
        return buf;
    }
    /** @inheritdoc */
    readUuid(): UUID {
        // UUID in big endian
        this.ensureData(16);
        const uuid = serializeUUID(this.data, this.position);
        this.position += 16;
        return uuid;
    }
}

/** BinaryProtocolWriter */
class BinaryProtocolWriter extends ProtocolWriter {
    /** @inheritdoc */
    writeMessageBegin(value: MessageHeader): void {
        const [type, seq, name] = value;
        this.ensureCapacity(8 + name.length);
        this.view.setUint16(this.position, VERSION_1);
        this.position += 3;
        this.writeI8(type);
        this.writeString(name);
        this.writeI32(seq);
    }
    /** @inheritdoc */
    writeMessageEnd(): void {
        this.done();
    }
    /** Do nothing in binary protocol */
    writeStructBegin(value: StructHeader): void {
        // do nothing
    }
    /** @inheritdoc */
    writeStructEnd(): void {
        this.ensureCapacity(1);
        this.data[this.position++] = STOP_FIELD;
    }
    /** @inheritdoc */
    writeMapBegin(value: MapHeader): void {
        const [keyType, valueType, size] = value;
        this.ensureCapacity(6);
        this.data[this.position++] = keyType;
        this.data[this.position++] = valueType;
        this.writeI32(size);
    }
    /** Do nothing in binary protocol */
    writeMapEnd(): void {
        // do nothing
    }
    /** @inheritdoc */
    writeListBegin(value: ListHeader): void {
        const [elemType, size] = value;
        this.ensureCapacity(5);
        this.data[this.position++] = elemType;
        this.writeI32(size);
    }
    /** Do nothing in binary protocol */
    writeListEnd(): void {
        // do nothing
    }
    /** @inheritdoc */
    writeBool(value: boolean): void {
        this.ensureCapacity(1);
        this.data[this.position++] = value ? 1 : 0;
    }
    /** @inheritdoc */
    writeI8(value: number): void {
        this.ensureCapacity(1);
        this.view.setInt8(this.position, value);
        this.position += 1;
    }
    /** @inheritdoc */
    writeI16(value: number): void {
        this.ensureCapacity(2);
        this.view.setInt16(this.position, value);
        this.position += 2;
    }
    /** @inheritdoc */
    writeI32(value: number): void {
        this.ensureCapacity(4);
        this.view.setInt32(this.position, value);
        this.position += 4;
    }
    /** @inheritdoc */
    writeI64(value: bigint): void {
        this.ensureCapacity(8);
        this.view.setBigInt64(this.position, value);
        this.position += 8;
    }
    /** @inheritdoc */
    writeDouble(value: number): void {
        this.ensureCapacity(8);
        this.view.setFloat64(this.position, value);
        this.position += 8;
    }
    /** @inheritdoc */
    writeString(value: string): void {
        this.writeBinary(encode(value));
    }
    /** @inheritdoc */
    writeBinary(value: Uint8Array): void {
        const size = value.byteLength;
        this.writeI32(size);
        if (size > CHUNK_SIZE) {
            this.send(value);
        } else {
            this.ensureCapacity(size);
            this.data.set(value, this.position);
            this.position += size;
        }
    }
    /** @inheritdoc */
    writeUuid(uuid: UUID): void {
        this.ensureCapacity(16);
        deserializeUUIDInto(uuid, this.data, this.position);
        this.position += 16;
    }
}

/** Binary protocol */
export const BinaryProtocol: Protocol = Object.freeze<Protocol>({
    name: 'binary',
    createReader(data) {
        return new BinaryProtocolReader(data);
    },
    createWriter(callback) {
        return new BinaryProtocolWriter(callback);
    },
});
