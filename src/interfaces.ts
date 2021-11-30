/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TClientConstructor, TProcessorConstructor, TProtocolConstructor, TTransportConstructor } from 'thrift';

/** 传输选项 */
export interface ThriftOptions {
    /** 底层传输 */
    transport?: TTransportConstructor;
    /** 底层协议 */
    protocol?: TProtocolConstructor;
}

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
    ? (...args: TArgs) => TRet | Promise<TRet> | PromiseLike<TRet>
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
