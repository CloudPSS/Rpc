import type { Duplex } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { I16_MAX } from '../limits.js';
import { BinaryProtocol } from '../protocol/binary.js';
import type { Protocol, RawMessage } from '../protocol/interface.js';
import type { Service, MethodSerializer, Processor } from '../service/interface.js';
import type { Transport } from '../transport/interface.js';
import { MessageType } from '../types.js';
import type { Exception } from '../error/exception.js';
import { ApplicationException, ApplicationExceptionType } from '../error/application-exception.js';

/** Client options */
export interface ClientOptions {
    /** Underlying transport */
    transport: Transport;
    /** Protocol */
    protocol?: Protocol;
}

const CONNECT_DELAY_INIT = 500;
const CONNECT_DELAY_MAX = 10000;
const CONNECT_DELAY_MULTIPLIER = 1.5;

/** Thrift rpc client */
export class Client {
    constructor(options: ClientOptions) {
        this.protocol = options.protocol ?? BinaryProtocol.default;
        this.transport = options.transport;
        void this.connect();
    }
    protected connectDelay = 0;
    /** connect to server */
    protected async connect(): Promise<void> {
        this.streamReady = new Promise<Duplex>((resolve) => {
            this.steamReadyCallback = resolve;
        });
        if (this.connectDelay) {
            await setTimeout(this.connectDelay);
        }
        try {
            const socket = await this.transport.connect();
            this.stream = this.protocol.createWriter().pipe(socket).pipe(this.protocol.createReader());
            this.stream.on('data', (data: RawMessage) => {
                this.processEnd(data);
            });
            this.stream.on('error', (err) => {
                void err;
            });
            this.stream.on('close', () => {
                this.stream = undefined;
                this.pending.forEach(([, , reject]) => {
                    reject(
                        new ApplicationException(ApplicationExceptionType.protocolError, 'Underlying transport closed'),
                    );
                });
                this.pending.clear();
                this.connectDelay = Math.min(
                    CONNECT_DELAY_MAX,
                    this.connectDelay ? this.connectDelay * CONNECT_DELAY_MULTIPLIER : CONNECT_DELAY_INIT,
                );
                void this.connect();
            });
            this.steamReadyCallback?.(this.stream);
            this.connectDelay = CONNECT_DELAY_INIT;
        } catch (ex) {
            void ex;
            this.connectDelay = Math.min(
                CONNECT_DELAY_MAX,
                this.connectDelay ? this.connectDelay * CONNECT_DELAY_MULTIPLIER : CONNECT_DELAY_INIT,
            );
            void this.connect();
        }
    }
    protected seqId = 0;
    /** Generate seq id */
    protected nextSeqId(): number {
        this.seqId++;
        const id = this.seqId;
        if (id >= I16_MAX) {
            this.seqId = 0;
        }
        return id;
    }
    readonly transport: Transport;
    readonly protocol: Protocol;
    protected stream?: Duplex;
    protected steamReadyCallback?: (stream: Duplex) => void;
    protected streamReady!: Promise<Duplex>;
    protected readonly services = new Map<string, [Service, Processor]>();
    protected readonly pending = new Map<
        number,
        [serializer: MethodSerializer, resolve: (value: unknown) => void, reject: (reason?: unknown) => void]
    >();
    /** Start rpc call */
    protected processStart(
        serializer: MethodSerializer,
        message: RawMessage,
        resolve: (value: unknown) => void,
        reject: (reason?: unknown) => void,
    ): void {
        const [type, seq] = message;
        if (type === MessageType.oneway) {
            resolve(undefined);
            if (this.stream?.writable) {
                this.stream.write(message);
            } else {
                void this.streamReady.then((stream) => {
                    stream.write(message);
                });
            }
            return;
        }
        this.pending.set(seq, [serializer, resolve, reject]);
        if (this.stream?.writable) {
            this.stream.write(message);
        } else {
            void this.streamReady.then((stream) => {
                stream.write(message);
            });
        }
    }
    /** End rpc call */
    protected processEnd(message: RawMessage): void {
        const [type, seq, , data] = message;
        const pending = this.pending.get(seq);
        if (pending == null) return;
        this.pending.delete(seq);
        const [serializer, resolve, reject] = pending;
        if (type === MessageType.reply) {
            const [returns, ...errors] = serializer.returns!.deserialize(data) as readonly [unknown, ...Exception[]];
            const error = errors.find((ex) => ex != null);
            if (error != null) {
                reject(error);
            } else {
                resolve(returns);
            }
        } else if (type === MessageType.exception) {
            reject(ApplicationException.fromExceptionMessage(message));
        } else {
            reject(
                new ApplicationException(ApplicationExceptionType.invalidMessageType, `Invalid message type ${type}`),
            );
        }
    }
    /** process call to remote server */
    protected async process(serializer: MethodSerializer, name: string, args: readonly unknown[]): Promise<unknown> {
        const type = serializer.returns ? MessageType.call : MessageType.oneway;
        const seq = type === MessageType.oneway ? 0 : this.nextSeqId();
        const message: RawMessage = [type, seq, name, serializer.args.serialize(args)];
        const result = new Promise<unknown>((resolve, reject) => {
            this.processStart(serializer, message, resolve, reject);
        });
        return result;
    }
    /** Get service */
    get<T extends Service>(...args: [name: string, service: T] | [service: T]): Processor<T> {
        const name = typeof args[0] === 'string' ? args[0] : args[0].name;
        const service = (typeof args[0] === 'string' ? args[1] : args[0])!;
        if (this.services.has(name)) {
            const [service0, processor] = this.services.get(name)!;
            if (service0 !== service) {
                throw new Error(`Service ${name} already registered`);
            }
            return processor satisfies Processor as unknown as Processor<T>;
        }
        if (service.methods == null || typeof service.name != 'string') {
            throw new TypeError('Invalid service');
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
            const fullName = `${name}:${key}`;
            methods.push([
                key,
                serializer.returns
                    ? async (...args: unknown[]): Promise<unknown> => {
                          return await this.process(serializer, fullName, args);
                      }
                    : (...args: unknown[]): void => {
                          this.process(serializer, fullName, args).catch((ex) => {
                              // ignore
                              void ex;
                          });
                      },
            ] as const);
        }
        const processor = Object.freeze(Object.fromEntries(methods)) as Processor<T>;
        this.services.set(name, [service, processor as unknown as Processor]);
        return processor;
    }
}
