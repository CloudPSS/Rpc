import { logger } from '../logger.js';
import type { Header } from './header.js';
import type { Definition } from './parser-import.js';
import { SyntaxError } from './thrift-idl.g.js';

/** Thrift IDL document */
export class Document {
    constructor(readonly headers: Header[], readonly definitions: Definition[]) {}
    /** Original text of document */
    text!: string;
    /** Path of document */
    source!: string;

    /** Print error info to logger */
    printError(error: Error): void {
        return logger.error(SyntaxError.prototype.format.call(error, [{ source: this.source, text: this.text }]));
    }
}
