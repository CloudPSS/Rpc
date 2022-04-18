import { ApplicationException, ApplicationExceptionType } from './error/application-exception';
import { Exception } from './error/exception';
import type { Method, MethodProcessor } from './method/interface';
import { BinaryProtocol } from './protocol/binary';
import type { Protocol, ProtocolReader, ProtocolWriter } from './protocol/interface';
import { BufferedTransport } from './transport/buffered';
import type { Transport, TransportReader, TransportWriter } from './transport/interface';
import { I16, I32, MessageType } from './types';

interface MethodHandler<T extends Method = Method> {
    processor: MethodProcessor<T>;
    method: T;
    thisArg: unknown;
}

class ServerConnection {
    private readonly transportReader: TransportReader;
    private readonly transportWriter: TransportWriter;
    private readonly reader: ProtocolReader;
    private readonly writer: ProtocolWriter;
    constructor(
        readonly server: Server,
        readonly readable: NodeJS.ReadableStream,
        readonly writable: NodeJS.WritableStream,
    ) {
        this.transportReader = server.transport.createReader(readable);
        this.reader = server.protocol.createReader(this.transportReader);
        this.transportWriter = server.transport.createWriter(writable);
        this.writer = server.protocol.createWriter(this.transportWriter);
    }

    private destroyed = false;
    private readonly handling = new Set<I16>();

    start(): void {
        void this.handle().catch((ex) => {
            ApplicationException.writeErrorMessage(this.writer, '', -1, ex, ApplicationExceptionType.internalError);
            this.destroy();
        });
    }
    stop(): void {
        if (this.destroyed) return;
        this.destroyed = true;
    }

    private destroy(): void {
        this.transportReader.destroy();
        this.transportWriter.destroy();
        if (this.writable.writable) {
            this.writable.end();
        }
    }

    private async throws(name: string, type: MessageType, seqId: I32, ex: unknown): Promise<void> {
        this.handling.add(seqId);
        await Promise.resolve();
        if (type === MessageType.call) {
            ApplicationException.writeErrorMessage(
                this.writer,
                name,
                seqId,
                ex,
                ApplicationExceptionType.internalError,
            );
        }
        this.handling.delete(seqId);
        if (this.destroyed && this.handling.size === 0) {
            this.destroy();
        }
    }

    private async call<T extends Method>(
        name: string,
        seqId: I32,
        handler: MethodHandler<T>,
        args: Parameters<T>,
    ): Promise<void> {
        this.handling.add(seqId);
        try {
            const result = await (Reflect.apply(handler.method, handler.thisArg, args) as Promise<ReturnType<T>>);
            if (handler.processor.result != null) {
                this.writer.writeMessageBegin(name, MessageType.reply, seqId);
                handler.processor.result.createWriter(this.writer).write({ success: result });
                this.writer.writeMessageEnd();
            }
        } catch (ex) {
            if (handler.processor.result != null) {
                if (ex instanceof Exception) {
                    this.writer.writeMessageBegin(name, MessageType.reply, seqId);
                    handler.processor.result.createWriter(this.writer).write({ throws: ex });
                    this.writer.writeMessageEnd();
                } else {
                    ApplicationException.writeErrorMessage(
                        this.writer,
                        name,
                        seqId,
                        ex,
                        ApplicationExceptionType.internalError,
                    );
                }
            }
        } finally {
            this.handling.delete(seqId);
        }
        if (this.destroyed && this.handling.size === 0) {
            this.destroy();
        }
    }

    private async handle(): Promise<void> {
        while (!this.destroyed) {
            await this.transportReader.ready();
            const { name, type, seqId } = this.reader.readMessageBegin();
            if (type !== MessageType.call && type !== MessageType.oneway) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidMessageType,
                    `Expected CALL or ONEWAY, got ${type}`,
                );
            }
            try {
                const handler = this.server.handler(name);
                if (handler == null) {
                    throw new ApplicationException(ApplicationExceptionType.unknownMethod, `Unknown method ${name}`);
                }
                if (typeof handler.method != 'function') {
                    throw new ApplicationException(
                        ApplicationExceptionType.internalError,
                        `Method ${name} is not implemented`,
                    );
                }
                if (handler.processor.result == null && type === MessageType.call) {
                    throw new ApplicationException(
                        ApplicationExceptionType.invalidMessageType,
                        `Method ${name} is ONEWAY method`,
                    );
                }
                if (handler.processor.result != null && type === MessageType.oneway) {
                    throw new ApplicationException(
                        ApplicationExceptionType.invalidMessageType,
                        `Method ${name} is not ONEWAY method`,
                    );
                }
                const argsReader = handler.processor.args.createReader(this.reader);
                do {
                    if (!argsReader.read()) {
                        await this.transportReader.ready();
                        continue;
                    }
                } while (argsReader.result == null);
                const args = argsReader.result;
                this.reader.readMessageEnd();
                void this.call(name, seqId, handler, args);
            } catch (ex) {
                void this.throws(name, type, seqId, ex);
            }
        }
    }
}
export interface ServerOptions {
    transport?: Transport;
    protocol?: Protocol;
}

export class Server {
    constructor(options?: ServerOptions) {
        this.protocol = options?.protocol ?? BinaryProtocol.default;
        this.transport = options?.transport ?? BufferedTransport.default;
    }
    readonly transport: Transport;
    readonly protocol: Protocol;
    protected readonly methods = new Map<string, MethodHandler>();
    handler(name: string): MethodHandler | undefined {
        return this.methods.get(name);
    }
}
