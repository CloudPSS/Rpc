import type { TransportReader, TransportWriter } from '../transport/interface';
import type {
    Double,
    FieldHeader,
    I16,
    I32,
    I64,
    I8,
    ListHeader,
    MapHeader,
    MessageHeader,
    MessageType,
    SetHeader,
    StructHeader,
    TType,
} from '../types';

export interface ProtocolReader {
    readMessageBegin(): MessageHeader;
    readMessageEnd(): void;
    readStructBegin(): StructHeader;
    readStructEnd(): void;
    readFieldBegin(): FieldHeader | null;
    readFieldEnd(): void;
    readMapBegin(): MapHeader;
    readMapEnd(): void;
    readListBegin(): ListHeader;
    readListEnd(): void;
    readSetBegin(): SetHeader;
    readSetEnd(): void;
    readBool(): boolean;
    readI8(): I8;
    readI16(): I16;
    readI32(): I32;
    readI64(): I64;
    readDouble(): Double;
    readString(): string;
    readBinary(): Uint8Array;
}

export interface ProtocolWriter {
    writeMessageBegin(name: string, type: MessageType, seqId: I32): void;
    writeMessageEnd(): void;
    writeStructBegin(name: string): void;
    writeStructEnd(): void;
    writeFieldBegin(name: string, type: TType, id: I32): void;
    writeFieldEnd(): void;
    writeMapBegin(keyType: TType, valType: TType, size: I32): void;
    writeMapEnd(): void;
    writeListBegin(elementType: TType, size: I32): void;
    writeListEnd(): void;
    writeSetBegin(elementType: TType, size: I32): void;
    writeSetEnd(): void;
    writeBool(value: boolean): void;
    writeI8(value: I8): void;
    writeI16(value: I16): void;
    writeI32(value: I32): void;
    writeI64(value: I64): void;
    writeDouble(value: Double): void;
    writeString(value: string): void;
    writeBinary(value: Uint8Array): void;
}

/** Protocol */
export interface Protocol {
    createReader(reader: TransportReader): ProtocolReader;
    createWriter(writer: TransportWriter): ProtocolWriter;
}
