/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Server } from 'net';
import type { Server as TlsServer, TlsOptions, ConnectionOptions as TlsConnectionOptions } from 'tls';
import type {
    TClientConstructor,
    TProcessorConstructor,
    TTransportConstructor,
    TProtocolConstructor,
    ConnectOptions,
    Connection,
} from 'thrift';
import type { Promisable } from 'type-fest';

/** Thrift 生成的服务模块，使用 `import * as XxxService from './thrift/XxxService'` */
export interface ServiceModule<TClient> {
    /** Client */
    Client: TClientConstructor<TClient>;
    /** Processor */
    Processor: TProcessorConstructor<any, any>;
}

/** 帮助类型 */
type HandlerFunction<T> = T extends (
    ...args: [...args: infer TArgs, callback?: (error: any, response: infer TRet) => void]
) => Promise<infer TRet>
    ? (...args: TArgs) => Promisable<TRet>
    : never;

/** 服务的实现类型 */
export type Handler<TClient> = {
    [P in keyof TClient]: HandlerFunction<TClient[P]>;
};

/** 帮助类型 */
type ClientFunction<T> = T extends (
    ...args: [...args: infer TArgs, callback: (error: any, response: infer TRet) => void]
) => Promise<infer TRet>
    ? (...args: TArgs) => Promise<TRet>
    : never;

/** 服务的调用方接口类型 */
export type Client<TClient> = {
    [P in keyof TClient]: ClientFunction<TClient[P]>;
};

/** 传输选项 */
export interface ThriftOptions {
    /** 底层传输 */
    transport?: TTransportConstructor;
    /** 底层协议 */
    protocol?: TProtocolConstructor;
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

/** 创建服务端 */
export function createServer(options?: ServerOptions & { tls?: undefined }): ThriftServer;
export function createServer(options?: ServerOptions & { tls: object }): ThriftTlsServer;

/** 客户端选项 */
export interface ClientOptions
    extends ThriftOptions,
        Pick<ConnectOptions, 'debug' | 'max_attempts' | 'retry_max_delay' | 'connect_timeout' | 'timeout'> {
    /** 默认为 `localhost` */
    host?: string;
    /** 默认为 `4000` */
    port?: number;
    /** 启用 TLS */
    tls?: TlsConnectionOptions;
}

/** 表示 Thrift RPC 客户端 */
export interface ThriftClient extends Connection {
    /** 添加或获取一个服务 */
    get<TClient>(service: ServiceModule<TClient>): Client<TClient>;
    /** 添加或获取一个服务 */
    get<TClient>(name: string, service: ServiceModule<TClient>): Client<TClient>;
    /**
     * 获取一个服务
     *
     * @throws 没有找到该服务
     */
    get<TClient>(name: string): Client<TClient>;
    /** 查看服务是否存在 */
    has(name: string): boolean;
}

/** 创建客户端 */
export function createClient(options?: ClientOptions): ThriftClient;
