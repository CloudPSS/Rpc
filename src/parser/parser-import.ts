export * from './token.js';
export * from './header.js';
export * from './definition.js';
export * from './document.js';
export * from '../constants.js';

/** Trim stars in jsdoc */
export function trimDoc(doc: string): string {
    const lines = doc.split('\n');
    lines[0] = lines[0].replace(/^\/\*\*\s*/, '');
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\*\/$/, '');
    for (let i = 1; i < lines.length; i++) {
        lines[i] = lines[i].replace(/^\s*\*\s*/, '');
    }
    while (lines.length > 0 && lines[0] === '') lines.shift();
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
}
