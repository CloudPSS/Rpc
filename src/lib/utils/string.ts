export function encode(data: string): Buffer {
    return Buffer.from(data, 'utf8');
}

export function decode(data: Uint8Array): string {
    return new TextDecoder('utf8').decode(data);
}
