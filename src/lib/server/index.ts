import { ApplicationException, ApplicationExceptionType } from '../error/application-exception.js';
import type { Handler, Method, MethodSerializer, Service } from '../service/interface.js';
import { BinaryProtocol } from '../protocol/binary.js';
import type { Protocol, RawMessage } from '../protocol/interface.js';
import type { Transport } from '../transport/interface.js';
import { type I16, MessageType } from '../types.js';
import type { Duplex } from 'node:stream';
import type { Exception } from '../error/exception.js';

/** Method handler */
interface MethodHandler {
    /** Method serializer */
    serializer: MethodSerializer;
    /** Method */
    method: Method;
    /** thisArg */
    thisArg: unknown;
}

/** Connected clients */
class ServerConnection {
    constructor(
        readonly server: Server,
        readonly stream: Duplex,
    ) {}

    destroyed = false;
    readonly handling = new Map<I16, Promise<void>>();
}
/** Server options */
export interface ServerOptions {
    /** Underlying transport */
    transport: Transport;
    /** Protocol */
    protocol?: Protocol;
}

/** Thrift rpc server */
export class Server {
    constructor(options: ServerOptions) {
        this.protocol = options.protocol ?? BinaryProtocol.default;
        this.transport = options.transport;
    }
    readonly transport: Transport;
    readonly protocol: Protocol;
    protected readonly connections = new Set<ServerConnection>();
    protected closeTransport?: () => Promise<void>;
    /** Start listening */
    async listen(): Promise<void> {
        const close = await this.transport.listen((stream) => {
            const connection = new ServerConnection(
                this,
                this.protocol.createWriter().pipe(stream).pipe(this.protocol.createReader()),
            );
            this.connections.add(connection);
            connection.stream.on('data', (data: RawMessage) => {
                const seq = data[1];
                const handling = this.handle(connection, data).then((result) => {
                    connection.handling.delete(seq);
                    if (result == null || !connection.stream.writable) return;
                    connection.stream.write(result);
                });
                connection.handling.set(seq, handling);
            });
            connection.stream.on('error', () => {
                connection.destroyed = true;
                this.connections.delete(connection);
            });
            connection.stream.on('close', () => {
                connection.destroyed = true;
                this.connections.delete(connection);
            });
        });
        this.closeTransport = close;
    }
    /** Stop listening */
    async close(): Promise<void> {
        // Stop receiving new connections
        const closeTransport = this.closeTransport?.();
        this.closeTransport = undefined;
        await Promise.all(
            [...this.connections].map(async (connection) => {
                // Mark connection as destroyed
                connection.destroyed = true;
                // Wait for all handling to finish
                await Promise.all(connection.handling.values());
                // Close connection
                connection.stream.end();
            }),
        );
        await closeTransport;
    }
    /** Registered services */
    protected readonly services = new Set<string>();
    /** Registered methods */
    protected readonly methods = new Map<string, MethodHandler>();
    /** handle remote call */
    protected async handle(connection: ServerConnection, message: RawMessage): Promise<RawMessage | undefined> {
        if (connection.destroyed) return;
        const [type, seq, name, data] = message;
        const method = this.methods.get(name);
        try {
            if (type !== MessageType.call && type !== MessageType.oneway) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidMessageType,
                    `Invalid message type ${type}`,
                );
            }
            if (method == null) {
                throw new ApplicationException(ApplicationExceptionType.unknownMethod, `Unknown method ${name}`);
            }
            if (type === MessageType.call && method.serializer.returns == null) {
                throw new ApplicationException(
                    ApplicationExceptionType.invalidMessageType,
                    `Method ${name} is ONEWAY method`,
                );
            }
            const args = method.serializer.args.deserialize(data) as unknown[];
            const result: unknown = await method.method.apply(method.thisArg, args);
            if (type === MessageType.oneway) {
                return undefined;
            }
            return [MessageType.reply, seq, name, method.serializer.returns!.serialize([result])];
        } catch (ex) {
            if (type === MessageType.oneway) {
                return undefined;
            }
            if (method?.serializer.throws?.length) {
                for (let index = 0; index < method.serializer.throws.length; index++) {
                    const error = method.serializer.throws[index];
                    if (ex instanceof error) {
                        const result: [unknown, ...Exception[]] = [undefined];
                        result[index + 1] = ex;
                        return [MessageType.reply, seq, name, method.serializer.returns!.serialize(result)];
                    }
                }
            }
            return ApplicationException.toExceptionMessage(name, seq, ex);
        }
    }

    /** Register service */
    route<T extends Service>(
        ...args: [name: string, service: T, handler: Handler<T>] | [service: T, handler: Handler<T>]
    ): void {
        const name = typeof args[0] === 'string' ? args[0] : args[0].name;
        const service = (typeof args[0] === 'string' ? args[1] : args[0]) as T;
        const handler = (typeof args[0] === 'string' ? args[2] : args[1]) as Handler<T>;
        if (this.services.has(name)) {
            throw new Error(`Service ${name} already registered`);
        }
        if (service.methods == null || typeof service.name != 'string') {
            throw new TypeError('Invalid service');
        }
        if (handler == null || typeof handler != 'object') {
            throw new TypeError('Invalid handler');
        }
        const methods = [];
        for (const key in service.methods) {
            if (!Object.prototype.hasOwnProperty.call(service.methods, key)) {
                continue;
            }
            const serializer = service.methods[key] as MethodSerializer;
            if (serializer == null) continue;
            if (serializer.args == null) {
                throw new TypeError(`Invalid method ${key}`);
            }
            const method = handler[key];
            if (method == null || typeof method != 'function') {
                throw new TypeError(`Invalid handler method ${key}`);
            }
            methods.push([
                `${name}:${key}`,
                {
                    serializer,
                    method,
                    thisArg: handler,
                },
            ] as const);
        }
        for (const [key, value] of methods) {
            this.methods.set(key, value);
        }
        this.services.add(name);
    }
}
