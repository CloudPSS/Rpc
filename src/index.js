import {
    MultiplexedProcessor,
    Multiplexer,
    createMultiplexServer,
    createConnection,
    createSSLConnection,
} from 'thrift';

/**
 * 获取服务名称
 * @param { import('.').ServiceModule<any> } module
 * @returns {string}
 */
function getServiceName(module) {
    let client = module;
    /** @type {Function} */
    let constructor;
    while (typeof client.Client != 'function') {
        client = client.Client;
        constructor = client;
    }
    const name = String(constructor.name);
    if (!name.endsWith('Client')) {
        throw new Error(`"${module}" is not a valid ServiceModule`);
    }
    return name.slice(0, name.length - 'Client'.length);
}
/**
 * 生成用户 Handler 的包装器
 * @param { import('.').Handler<any> } handler
 * @param { import('.').ServiceModule<any> } processor
 * @param { import('.').ThriftServerBase } server
 * @returns { import('.').Handler<any> }
 */
function wrapHandler(handler, processor, server) {
    /** @type { import('.').Handler<any> } */
    const wrap = {};
    let currentObj = processor.prototype;
    do {
        // 在原型链上查找 process_* 方法
        for (const processorKey of Object.getOwnPropertyNames(currentObj)) {
            if (!processorKey.startsWith('process_')) continue;

            const key = processorKey.slice('process_'.length);
            const wrapper = async function (...args) {
                if (typeof args[args.length - 1] === 'function') {
                    const callback = args.pop();
                    try {
                        const ret = await this[key](...args);
                        callback(null, ret);
                    } catch (ex) {
                        callback(ex);
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
            wrap[key] = wrapper;
        }
    } while ((currentObj = Object.getPrototypeOf(currentObj)));
    return wrap;
}

export function createServer(options) {
    const multiplex = new MultiplexedProcessor();
    /** @type {import('.').ThriftServerBase} */
    const server = createMultiplexServer(multiplex, options);
    Object.defineProperty(server, '_processor', { value: multiplex });
    server.route = function route(name, processor, handler) {
        if (!name) {
            throw new TypeError(`Invalid empty name`);
        }
        if (typeof name == 'string') {
            // OK
        } else if (typeof name == 'object') {
            // 第二种签名
            handler = processor;
            processor = name;
            name = getServiceName(processor);
        } else {
            throw new TypeError(`Invalid name ${name}, string expected`);
        }
        if (name in multiplex.services) {
            throw new Error(`Service with name "${name}" already exists`);
        }
        while (typeof processor.Processor == 'function') {
            processor = processor.Processor;
        }
        this._processor.registerProcessor(name, new processor(wrapHandler(handler, processor, this)));
        return this;
    };
    return server;
}

export function createClient(options) {
    let { host, port, tls, ...opt } = options ?? {};
    host = host || 'localhost';
    port = Number.parseInt(port);
    if (Number.isNaN(port) || port <= 0 || port > 65535) {
        port = 4000;
    }
    /** @type {import('.').ThriftClient} */
    const connection = tls ? createSSLConnection(host, port, { ...opt, ...tls }) : createConnection(host, port, opt);
    const multiplexer = new Multiplexer();
    const clients = new Map();
    connection.get = function (name, client) {
        if (!name) {
            throw new TypeError(`Invalid empty name`);
        }
        if (typeof name == 'string') {
            // OK
        } else if (typeof name == 'object') {
            // 第二种签名
            client = name;
            name = getServiceName(client);
        } else {
            throw new TypeError(`Invalid name ${name}, string expected`);
        }
        let service = clients.get(name);
        if (service) {
            return service;
        }
        if (!client) {
            throw new Error(`Service with name "${name}" has not created`);
        }
        while (typeof client.Client == 'function') {
            client = client.Client;
        }
        service = multiplexer.createClient(name, client, this);
        clients.set(name, service);
        return service;
    };
    connection.has = function (name) {
        return !!clients.get(name);
    };
    return connection;
}
