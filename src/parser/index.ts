import { parse as p, SyntaxError } from './thrift-idl.g.js';
import type { Document } from './document.js';
import { logger } from '../logger.js';

export { SyntaxError };

/** parse document */
export function parse(text: string, source = ''): Document | undefined {
    try {
        const document = p(text, { grammarSource: source });
        document.source = source;
        document.text = text;
        return document;
    } catch (ex) {
        if (ex instanceof SyntaxError) {
            logger.error(ex.format([{ source, text }]));
            return undefined;
        }
        throw ex;
    }
}
