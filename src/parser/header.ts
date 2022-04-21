import type { LocationRange } from 'peggy';
import { inspect, type InspectOptionsStylized } from 'node:util';
import { Literal, Token, type Identifier } from './token.js';
import { SyntaxError } from './thrift-idl.g.js';
import { basename } from 'node:path';
import { isJsIdentifier } from '../util.js';

/** Base class for include and cpp_include */
class IncludeBase extends Token {
    constructor(location: LocationRange, readonly path: Literal) {
        super(location);
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `${this.constructor.name}(${inspect(this.path, options)})`;
    }
}

/** include directive */
export class Include extends IncludeBase {
    constructor(location: LocationRange, path: Literal) {
        if (!path.value.endsWith('.thrift'))
            throw new SyntaxError(`Include path must end with ".thrift"`, null, path.value, path.location);
        const base = basename(path.value, '.thrift');
        if (!isJsIdentifier(base)) {
            throw new SyntaxError(`Include filename must be a valid identifier`, null, path.value, path.location);
        }
        super(location, path);
    }
}

/** cpp_include directive */
export class CppInclude extends IncludeBase {}

/** namespace directive */
export class Namespace extends Token {
    constructor(location: LocationRange, readonly scope: string, readonly namespace: Identifier) {
        super(location);
        namespace.assertNoDot();
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `Namespace(${inspect(this.namespace, options)}) ${inspect(this.scope, options)}`;
    }
}

/** Header directives */
export type Header = Include | CppInclude | Namespace;
