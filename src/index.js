import {
    MultiplexedProcessor,
    Multiplexer,
    createMultiplexServer,
    createConnection,
    createSSLConnection,
} from 'thrift';

function wrapHandler(handler) {
    const wrap = {};
    for (const key in handler) {
        const func = handler[key];
        if (typeof func != 'function') {
            continue;
        }
        const wrapper = async function (...args) {
            const callback = args.pop();
            try {
                const ret = await this[key](...args);
                callback(null, ret);
            } catch (ex) {
                callback(ex);
            }
        }.bind(handler);
        Object.defineProperty(wrapper, 'length', { value: -1 });
        wrap[key] = wrapper;
    }
    return wrap;
}

export function createServer(options) {
    const multiplex = new MultiplexedProcessor();
    const server = createMultiplexServer(multiplex, options);
    server.route = function route(name, processor, handler) {
        if (name in multiplex.services) {
            throw new Error(`Service with name "${name}" already exists`);
        }
        while (typeof processor.Processor == 'function') {
            processor = processor.Processor;
        }
        multiplex.registerProcessor(name, new processor(wrapHandler(handler)));
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
    const connection = tls ? createSSLConnection(host, port, { ...opt, ...tls }) : createConnection(host, port, opt);
    const multiplexer = new Multiplexer();
    const clients = new Map();
    connection.get = function (name, client) {
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
