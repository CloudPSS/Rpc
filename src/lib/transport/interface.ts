import type { Duplex } from 'node:stream';

export const FrameEnd = Symbol('FrameEnd');
/** Indicates end of a frame */
export type FrameEnd = typeof FrameEnd;
/** An encoded message */
export type FrameData = Buffer | FrameEnd;

/**
 * Read data from underlying stream, generate {@link FrameData} (MAY or MAY NOT includes {@link FrameEnd})
 * Write data to underlying stream, consume {@link FrameData} (INCLUDES {@link FrameEnd})
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransportStream extends Duplex {}

/** Underlying transport */
export interface Transport {
    /** connect to server */
    connect(): Promise<TransportStream>;
    /** listen for client */
    listen(onConnect: (stream: TransportStream) => void): Promise<() => Promise<void>>;
}
