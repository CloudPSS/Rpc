/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { MultiplexedProcessor, createMultiplexServer } from 'thrift';
import { isObject, getServiceName, getProcessor } from './utils.js';
import type { Server } from 'net';
import type { Server as TlsServer, TlsOptions } from 'tls';
import type { ServiceModule, Handler, ThriftOptions } from './interfaces.js';

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
            wrap[key] = wrapper as typeof wrap[typeof key];
        }
    } while ((currentObj = Object.getPrototypeOf(currentObj) as object));
    return wrap;
}
/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls?: undefined }): ThriftServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls: object }): ThriftTlsServer;
/** 创建服务端 */
export function createServer(options?: ServerOptions): ThriftServer | ThriftTlsServer {
    const multiplex = new MultiplexedProcessor();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const server = createMultiplexServer(multiplex, options) as ThriftServer | ThriftTlsServer;
    Object.defineProperty(server, '_processor', { value: multiplex });
    Object.defineProperty(server, 'route', {
        value: function route<TClient>(
            this: ThriftServer | ThriftTlsServer,
            name: string | ServiceModule<TClient>,
            module: ServiceModule<TClient> | Handler<TClient>,
            handler: Handler<TClient> | undefined,
        ): ThriftServer | ThriftTlsServer {
            if (!name) {
                throw new TypeError(`Invalid empty name`);
            }
            if (typeof name == 'string') {
                // OK
            } else if (isObject(name)) {
                // 第二种签名
                handler = module as Handler<TClient>;
                module = name;
                name = getServiceName(module);
            } else {
                throw new TypeError(`Invalid name ${String(name)}, string expected`);
            }
            // @ts-ignore
            if (name in multiplex.services) {
                throw new Error(`Service with name "${name}" already exists`);
            }
            const processor = getProcessor(module as ServiceModule<TClient>);
            // @ts-ignore
            this._processor.registerProcessor(name, new processor(wrapHandler(handler, processor, this))); // eslint-disable-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return this;
        },
    });
    return server;
}
