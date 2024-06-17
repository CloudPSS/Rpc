/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Exception } from '../error/exception.js';
import type { RawStruct } from '../protocol/interface.js';

/** Method in a {@link Service} */
export type Method = (...args: any[]) => any;

/** Handle struct serialization */
export interface StructSerializer<in TIn, out TOut extends TIn = TIn> {
    /** Serialize struct */
    serialize(value: TIn): RawStruct;
    /** Deserialize struct */
    deserialize(value: RawStruct): TOut;
}
/** Constructor of Exception */
type ExceptionConstructor<T extends Exception = Exception> = abstract new (...args: any[]) => T;

/** Handle method serialization */
export interface MethodSerializer<
    TArgs extends StructSerializer<readonly any[]> = StructSerializer<readonly any[]>,
    TReturn extends StructSerializer<readonly [any, ...Exception[]]> | undefined =
        | StructSerializer<readonly [any, ...Exception[]]>
        | undefined,
> {
    /** Handle method args serialization */
    readonly args: TArgs;
    /** Handle method returns serialization */
    readonly returns?: TReturn;
    /** Handle method throws serialization */
    readonly throws?: readonly ExceptionConstructor[];
}

/** Service info */
export interface Service<
    T extends Record<string, MethodSerializer<any, any>> = Record<string, MethodSerializer<any, any>>,
> {
    /** Name of service */
    readonly name: string;
    /** Methods of service */
    readonly methods: T;
}

/** infer input type */
type InType<T> = T extends StructSerializer<infer U, any> ? U : never;
/** infer output type */
type OutType<T> = T extends StructSerializer<any, infer U> ? U : never;

/** infer method */
type HandlerMethodOf<T extends MethodSerializer<any, any>> =
    T extends MethodSerializer<infer Args, infer Returns>
        ? (...args: OutType<Args>) => InType<Returns> extends [infer R] ? R | PromiseLike<R> : never
        : never;

/** infer method */
type ProcessorMethodOf<T extends MethodSerializer<any, any>> =
    T extends MethodSerializer<infer Args, infer Returns>
        ? (...args: InType<Args>) => OutType<Returns> extends [infer R] ? R | PromiseLike<R> : never
        : never;

/** handler object for service */
export type Handler<T extends Service<any> = Service<any>> =
    T extends Service<infer U> ? { readonly [P in keyof U]: HandlerMethodOf<U[P]> } : never;

/** processor object for service */
export type Processor<T extends Service<any> = Service<any>> =
    T extends Service<infer U> ? { readonly [P in keyof U]: ProcessorMethodOf<U[P]> } : never;
