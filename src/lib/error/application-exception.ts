import type { RawMessage } from '../protocol/interface.js';
import { MessageType, type I32, TType } from '../types.js';
import { decode, encode } from '../utils/string.js';

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

/** {@link MessageType.exception} is used for other exceptions. That is: when the service method throws an exception that is not declared in the Thrift IDL file, or some other part of the Thrift stack throws an exception. For example when the server could not encode or decode a message or struct. */
export class ApplicationException extends Error {
    constructor(
        readonly type: ApplicationExceptionType,
        message: string,
    ) {
        super(message);
    }

    /** Create an exception from {@link RawMessage} */
    static fromExceptionMessage(message: RawMessage): ApplicationException {
        const [type, , , data] = message;
        if (type !== MessageType.exception) {
            throw new Error('Invalid message type');
        }
        const [, fields] = data;
        const messageField = fields.find((field) => field[0] === 1);
        const typeField = fields.find((field) => field[0] === 2);
        const msg = decode(messageField?.[3] as Uint8Array, '');
        const t = (typeField?.[3] as ApplicationExceptionType) ?? ApplicationExceptionType.unknown;
        return new ApplicationException(t, msg);
    }

    /** Create a message with type {@link MessageType.exception} */
    static toExceptionMessage(
        name: string,
        seqId: I32,
        error: unknown,
        type: ApplicationExceptionType = ApplicationExceptionType.internalError,
    ): RawMessage {
        let message: string;
        if (error instanceof Error) {
            message = error.message;
            if (error instanceof ApplicationException) {
                type = error.type;
            }
        } else {
            message = String(error);
        }
        return [
            MessageType.exception,
            seqId,
            name,
            [
                'TApplicationException',
                [
                    [1, 'message', TType.binary, encode(message)],
                    [2, 'type', TType.i32, type],
                ],
            ],
        ];
    }
}
