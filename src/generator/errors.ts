import type { LocationRange } from 'peggy';
import { SyntaxError } from '../parser/index.js';

/** Compile error */
export class CompileError extends SyntaxError {
    constructor(message: string, location: LocationRange) {
        super(message, null, null, location);
    }
}
