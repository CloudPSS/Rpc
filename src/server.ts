import type { Server } from 'node:net';
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
    server: ThriftServer | ThriftTlsServer,
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
                        const ret = await this[key](...args);
                        callback(null, ret);
                    } catch (ex) {
                        callback(ex as Error);
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
};

/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls?: undefined }): ThriftServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls: object }): ThriftTlsServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions): ThriftServer | ThriftTlsServer {
    const multiplex = new MultiplexedProcessor();
    const server = createMultiplexServer(multiplex, options) as InternalServer;
    Object.defineProperty(server, '_processor', { value: multiplex });
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
