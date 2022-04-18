import type { Header } from './header.js';
import type { Definition } from './parser-import.js';

/** Thrift IDL document */
export class Document {
    constructor(readonly headers: Header[], readonly definitions: Definition[]) {}
}
