import { Const, Struct } from '../parser/definition.js';
import type { Document } from '../parser/document.js';
import type { Definition } from '../parser/parser-import.js';

function generateDefinition(def: Definition): string {
    if (def instanceof Const) {
        return `export const ${def.name.name} = ${String(def.value.value)};`;
    }
    if (def instanceof Struct) {
        return `
/** ${def.doc ?? ''} */
export class ${def.name.name} {
    constructor(${def.fields
        .map(
            (f) => `
        /** ${f.doc ?? ''} */
        public ${f.name.name}: ${f.type.name}`,
        )
        .join(',')}
    ) {}
}`;
    }
    return '';
}

export function generate(document: Document): string {
    let ret = '';
    for (const def of document.definitions) {
        ret += generateDefinition(def);
    }
    return ret;
}
