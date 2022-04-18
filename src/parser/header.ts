import type { LocationRange } from 'peggy';
import { inspect, type InspectOptionsStylized } from 'node:util';
import { Token, type Identifier } from './token.js';

/** include directive */
export class Include extends Token {
    constructor(location: LocationRange, readonly path: string) {
        super(location);
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `${this.constructor.name}(${inspect(this.path, options)})`;
    }
}

/** cpp_include directive */
export class CppInclude extends Include {}

/** namespace directive */
export class Namespace extends Token {
    constructor(location: LocationRange, readonly scope: string, readonly namespace: Identifier) {
        super(location);
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `Namespace(${inspect(this.namespace, options)}) ${inspect(this.scope, options)}`;
    }
}

/** Header directives */
export type Header = Include | CppInclude | Namespace;
