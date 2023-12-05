import type { StreamTransport, StreamTransportOptions } from './stream.js';

export * from './interface.js';

/** Create StreamTransport */
export async function createStreamTransport(options: StreamTransportOptions): Promise<StreamTransport> {
    const { StreamTransport } = await import('./stream.js');
    return new StreamTransport(options);
}
