/** Encode string to utf-8 buffer */
export function encode(data: string): Buffer {
    return Buffer.from(data, 'utf8');
}

const decoder = new TextDecoder('utf8');
/** Decode utf-8 string */
export function decode(data: Uint8Array, defaultValue = ''): string {
    if (data == null) {
        return defaultValue ?? '';
    }
    return decoder.decode(data);
}
