import type { Server, Socket } from 'node:net';
import type { Server as TlsServer, TlsOptions } from 'node:tls';
import { MultiplexedProcessor, createMultiplexServer } from 'thrift';
import { isObject, getServiceName, getProcessor } from './utils.js';
import type { ServiceModule, Handler, ThriftOptions } from './interfaces.js';

declare module 'thrift' {
    function createMultiplexServer<THandler>(
        processor: MultiplexedProcessor,
        options?: ServerOptions<MultiplexedProcessor, THandler>,
    ): Server | TlsServer;

    /** @inheritdoc */
    interface MultiplexedProcessor {
        /** 已注册的服务 */
        readonly services: Readonly<Record<string, unknown>>;

        /** 注册服务 */
        registerProcessor<THandler>(name: string, processor: THandler): void;
    }
}

/** 服务端选项 */
export interface ServerOptions extends ThriftOptions {
    /** 启用 TLS */
    tls?: TlsOptions;
}

/** 表示 Thrift RPC 服务端 */
interface ThriftServerBase {
    /** 添加一个服务 */
    route<TClient>(name: string, service: ServiceModule<TClient>, handler: Handler<TClient>): this;
    /** 添加一个服务 */
    route<TClient>(service: ServiceModule<TClient>, handler: Handler<TClient>): this;
}

/** 表示 Thrift RPC 服务端 */
export interface ThriftServer extends Server, ThriftServerBase {}

/** 表示 Thrift RPC 服务端 */
export interface ThriftTlsServer extends TlsServer, ThriftServerBase {}

/**
 * 生成用户 Handler 的包装器
 */
function wrapHandler<T>(
    handler: Handler<T>,
    processor: ServiceModule<T>['Processor'],
    server: InternalServer,
): Handler<T> {
    const wrap = {} as Handler<T>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    let currentObj = (processor as new () => unknown).prototype as object;
    do {
        // 在原型链上查找 process_* 方法
        for (const processorKey of Object.getOwnPropertyNames(currentObj)) {
            if (!processorKey.startsWith('process_')) continue;

            const key = processorKey.slice('process_'.length) as keyof typeof handler;
            const wrapper = async function (this: typeof handler, ...args: unknown[]) {
                if (typeof args[args.length - 1] === 'function') {
                    const callback = args.pop() as (err: Error | null, result?: unknown) => void;
                    try {
                        server._beforeCall();
                        const ret = await this[key](...args);
                        callback(null, ret);
                    } catch (ex) {
                        callback(ex as Error);
                    } finally {
                        server._afterCall();
                    }
                } else {
                    // one-way methods
                    try {
                        await this[key](...args);
                    } catch (ex) {
                        server.emit('error', ex);
                    }
                }
            }.bind(handler);

            // 设置长度以强制使用回调版本重载
            Object.defineProperty(wrapper, 'length', { value: -1 });
            wrap[key] = wrapper as (typeof wrap)[typeof key];
        }
    } while ((currentObj = Object.getPrototypeOf(currentObj) as object));
    return wrap;
}

/** 服务端 */
type InternalServer = (ThriftServer | ThriftTlsServer) & {
    _processor: MultiplexedProcessor;
    _pendingCalls: number;
    _closing: boolean;
    /** 调用方法开始 */
    _beforeCall(): void;
    /** 调用方法结束 */
    _afterCall(): void;
};

/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls?: undefined }): ThriftServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls: object }): ThriftTlsServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions): ThriftServer | ThriftTlsServer {
    const multiplex = new MultiplexedProcessor();
    const server = createMultiplexServer(multiplex, options) as InternalServer;

    const connections = new Map<string, Socket>();
    server.on('connection', (socket: Socket) => {
        const id = `${socket.remoteAddress}:${socket.remotePort}`;
        connections.set(id, socket);
        socket.on('close', () => connections.delete(id));
    });

    const closeConnections = (): void => {
        for (const socket of connections.values()) {
            socket.end();
        }
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const _close = server.close;
    server.close = function close(this: InternalServer, ...args): InternalServer {
        if (this._closing) {
            Reflect.apply(_close, this, args);
            return this;
        }
        this._closing = true;
        Reflect.apply(_close, this, args);
        if (this._pendingCalls === 0) {
            closeConnections();
        }
        return this;
    };
    Object.defineProperty(server, '_processor', { value: multiplex });
    Object.defineProperty(server, '_pendingCalls', { value: 0, writable: true });
    Object.defineProperty(server, '_closing', { value: false, writable: true });
    Object.defineProperty(server, '_beforeCall', {
        value: function (this: InternalServer) {
            if (this._closing) {
                throw new Error('Server is closing');
            }
            this._pendingCalls++;
        },
    });
    Object.defineProperty(server, '_afterCall', {
        value: function (this: InternalServer) {
            this._pendingCalls--;
            if (this._closing && this._pendingCalls === 0) {
                closeConnections();
            }
        },
    });
    Object.defineProperty(server, 'route', {
        value: function route<TClient>(
            this: InternalServer,
            name: string | ServiceModule<TClient>,
            service: ServiceModule<TClient> | Handler<TClient>,
            handler: Handler<TClient> | undefined,
        ): InternalServer {
            if (!name) throw new TypeError(`Invalid empty name/service`);

            let _name, _service, _handler;
            if (typeof name == 'string') {
                // OK
                _name = name;
                _service = service as ServiceModule<TClient>;
                if (!handler) throw new TypeError(`Invalid empty handler`);
                _handler = handler;
            } else if (isObject(name)) {
                // 第二种签名
                _name = getServiceName(name);
                _service = name;
                if (!service) throw new TypeError(`Invalid empty handler`);
                _handler = service as Handler<TClient>;
            } else {
                throw new TypeError(`Invalid name ${String(name)}, string expected`);
            }

            if (_name in multiplex.services) {
                throw new Error(`Service with name "${_name}" already exists`);
            }
            const processor = getProcessor(_service);
            this._processor.registerProcessor(_name, new processor(wrapHandler(_handler, processor, this)));
            return this;
        },
    });
    return server;
}
