import type { InspectOptionsStylized } from 'node:util';

/** Add docs to inspect info */
export function inspectDoc(value: { doc?: string | undefined }, options: InspectOptionsStylized): string {
    if (!value.doc) return '';

    return ' ' + options.stylize(`// ${value.doc}`, 'module');
}
