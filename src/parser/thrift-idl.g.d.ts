import type { Document } from './document.js';
import type { ParserOptions, parser, LocationRange } from 'peggy';

export function parse(input: string, options?: ParserOptions): Document;

export class SyntaxError extends parser.SyntaxError {
    constructor(message: string, expected: parser.Expectation[] | null, found: string | null, location: LocationRange);
}
