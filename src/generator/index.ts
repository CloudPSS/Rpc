import type { Document } from '../parser/document.js';
import { Generator } from './generator.js';

/** generate */
export function generate(document: Document): string {
    if (document == null) throw new ReferenceError('document is null');
    const g = new Generator(document);
    g.generate();
    return g.result;
}
