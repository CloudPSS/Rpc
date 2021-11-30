import type { ServiceModule } from './interfaces';

/**
 * 是否为 object
 */
export function isObject(value: unknown): value is object {
    return value != null && (typeof value == 'object' || typeof value == 'function');
}

/**
 * 获取服务 Client
 */
export function getClient<T = unknown>(module: ServiceModule<T>, check = true): ServiceModule<T>['Client'] {
    let client = module as ServiceModule<T> & ServiceModule<T>['Client'];
    while (typeof client.Client == 'function') {
        client = client.Client as ServiceModule<T> & ServiceModule<T>['Client'];
    }
    if (check && typeof client != 'function') {
        throw new Error(`${String(module)} is not a client`);
    }
    return client;
}

/**
 * 获取服务 Processor
 */
export function getProcessor<T = unknown>(module: ServiceModule<T>, check = true): ServiceModule<T>['Processor'] {
    let processor = module as ServiceModule<T> & ServiceModule<T>['Processor'];
    while (typeof processor.Processor == 'function') {
        processor = processor.Processor as ServiceModule<T> & ServiceModule<T>['Processor'];
    }
    if (check && typeof processor != 'function') {
        throw new Error(`${String(module)} is not a processor`);
    }
    return processor;
}

/**
 * 获取服务名称
 */
export function getServiceName<T = unknown>(module: ServiceModule<T>): string {
    const service = getClient(module, false);
    if (typeof service == 'function') {
        const name = String(service.name);
        if (!name.endsWith('Client')) {
            throw new Error(`"${String(module)}" is not a valid ServiceModule`);
        }
        return name.slice(0, -'Client'.length);
    }
    const processor = getProcessor(module, false);
    if (typeof processor == 'function') {
        const name = String(processor.name);
        if (!name.endsWith('Processor')) {
            throw new Error(`"${String(module)}" is not a valid ServiceModule`);
        }
        return name.slice(0, -'Processor'.length);
    }
    throw new Error(`"${String(module)}" is not a valid ServiceModule`);
}
