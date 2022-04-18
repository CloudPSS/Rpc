import type { ProtocolWriter } from '../protocol/interface';
import { I32, MessageType, TType } from '../types';

export enum ApplicationExceptionType {
    /** used in case the type from the peer is unknown. */
    unknown = 0,
    /** used in case the method requested by the client is unknown by the server. */
    unknownMethod = 1,
    invalidMessageType = 2,
    wrongMethodName = 3,
    /** used internally by the client to indicate a wrong sequence id in the response. */
    badSequenceId = 4,
    /** used internally by the client to indicate a response without any field (result nor exception). */
    missingResult = 5,
    /** used when the server throws an exception that is not declared in the Thrift IDL file. */
    internalError = 6,
    /** used when something goes wrong during decoding. For example when a list is too long or a required field is missing. */
    protocolError = 7,
    invalidTransform = 8,
    invalidProtocol = 9,
    unsupportedClientType = 10,
}

export class ApplicationException extends Error {
    constructor(readonly type: ApplicationExceptionType, message: string) {
        super(message);
    }

    /** Write an error message */
    static writeErrorMessage(
        writer: ProtocolWriter,
        name: string,
        seqId: I32,
        error: unknown,
        type: ApplicationExceptionType = ApplicationExceptionType.internalError,
    ): void {
        let message: string;
        if (error instanceof Error) {
            message = error.message;
            if (error instanceof ApplicationException) {
                type = error.type;
            }
        } else {
            message = String(error);
        }
        writer.writeMessageBegin(name, MessageType.exception, seqId);
        writer.writeStructBegin('TApplicationException');
        writer.writeFieldBegin('message', TType.binary, 1);
        writer.writeString(message);
        writer.writeFieldEnd();
        writer.writeFieldBegin('type', TType.i32, 2);
        writer.writeI32(type);
        writer.writeFieldEnd();
        writer.writeStructEnd();
        writer.writeMessageEnd();
    }
}
