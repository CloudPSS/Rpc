/** Throw by TransportReader when not enough buffered data */
export class DrainError extends Error {}

/** Throw by TransportReader when not enough frame data */
export class FrameEndError extends Error {}
