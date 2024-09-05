import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls';
import { once } from 'node:events';
import { debuglog, type DebugLoggerFunction } from 'node:util';
import { type ConnectOptions, Connection, Multiplexer, createConnection, createSSLConnection } from 'thrift';
import { isObject, getServiceName, getClient } from './utils.js';
import type { Client, ServiceModule, ThriftOptions } from './interfaces.js';
import { DEFAULT_PROTOCOL, DEFAULT_TRANSPORT } from './options.js';

/** 客户端选项 */
export interface ClientOptions
    extends ThriftOptions,
        Pick<ConnectOptions, 'debug' | 'max_attempts' | 'retry_max_delay' | 'connect_timeout' | 'timeout'> {
    /** 默认为 `localhost` */
    host?: string;
    /** RPC 端口 */
    port: number;
    /** 启用 TLS */
    tls?: TlsConnectionOptions | boolean;
}

/** 表示 Thrift RPC 客户端 */
export interface ThriftClient extends Connection {
    /** 添加或获取一个服务 */
    get<TClient>(service: ServiceModule<TClient>): Client<TClient>;
    /** 添加或获取一个服务 */
    // eslint-disable-next-line @typescript-eslint/unified-signatures
    get<TClient>(name: string, service: ServiceModule<TClient>): Client<TClient>;
    /**
     * 获取一个服务
     * @throws 没有找到该服务
     */
    get<TClient>(name: string): Client<TClient>;
    /** 查看服务是否存在 */
    has(name: string): boolean;
    /** 结束 */
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    end(): Promise<void>;
}

/** 创建客户端 */
export function createClient(options: ClientOptions): ThriftClient {
    const { host, port, tls, ...opt } = options ?? ({ port: 4000 } satisfies ClientOptions);
    let logger: DebugLoggerFunction = debuglog(`cloudpss/rpc-client-${port}`, (l) => (logger = l));
    const _host = host ? String(host) : '127.0.0.1';
    const _port = Number.parseInt(String(port ?? '4000'));
    if (!Number.isInteger(_port) || _port <= 0 || _port > 65535) {
        throw new TypeError(`Invalid port rpc ${String(port)}`);
    }
    logger('resolved host=%s, port=%d', _host, _port);
    const _tls = isObject(tls) ? tls : tls ? {} : undefined;

    opt.max_attempts ??= Number.POSITIVE_INFINITY;
    opt.retry_max_delay ??= 5000;
    opt.transport ??= DEFAULT_TRANSPORT;
    opt.protocol ??= DEFAULT_PROTOCOL;

    const connection = (
        _tls ? createSSLConnection(_host, _port, { ...opt, ..._tls }) : createConnection(_host, _port, opt)
    ) as ThriftClient;

    connection.on('error', (ex) => logger(`error: %s`, ex));
    connection.on('close', () => logger(`closed`));
    connection.on('reconnecting', ({ delay, attempt }) => logger(`reconnecting in %dms, attempt %d`, delay, attempt));
    connection.on('connect', () => logger(`connected`));

    const multiplexer = new Multiplexer();
    const clients = new Map<string, Client<unknown>>();
    Object.defineProperties(connection, {
        get: {
            value: function get<TClient>(
                this: ThriftClient,
                name: string | ServiceModule<TClient>,
                module?: ServiceModule<TClient>,
            ): Client<TClient> {
                if (!name) {
                    throw new TypeError(`Invalid empty name`);
                }
                if (typeof name == 'string') {
                    // OK
                } else if (isObject(name)) {
                    // 第二种签名
                    module = name;
                    name = getServiceName(module);
                } else {
                    throw new TypeError(`Invalid name ${String(name)}, string expected`);
                }
                let service = clients.get(name);
                if (service != null) {
                    return service as Client<TClient>;
                }
                if (module == null) {
                    throw new Error(`Service with name "${name}" has not created`);
                }
                const client = getClient(module);
                service = multiplexer.createClient(name, client, this) as Client<TClient>;
                clients.set(name, service);
                logger(`service %s created`, name);
                return service as Client<TClient>;
            },
        },
        has: {
            value: function (this: ThriftClient, name: string): boolean {
                return clients.get(name) != null;
            },
        },
        end: {
            value: async function (this: ThriftClient): Promise<void> {
                logger(`ending`);
                Connection.prototype.end.call(this);
                await once(this, 'close');
            },
        },
    });
    return connection;
}
