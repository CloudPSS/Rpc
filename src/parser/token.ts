import type { LocationRange } from 'peggy';
import { inspect, InspectOptionsStylized } from 'node:util';
import { KEYWORDS } from '../constants.js';
import { SyntaxError } from './thrift-idl.g.js';
import { JS_RESERVED } from '../util.js';

/** Token */
export abstract class Token {
    constructor(readonly location: LocationRange) {}
    /** create inspect string */
    protected abstract [inspect.custom](depth: number, options: InspectOptionsStylized): string;
}

/** Identifier */
export class Identifier extends Token {
    constructor(location: LocationRange, readonly name: string) {
        super(location);
        if (KEYWORDS.includes(name)) {
            throw new SyntaxError(`Identifier "${name}" is a reserved keyword`, null, name, location);
        }
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return options.stylize(this.name, 'symbol');
    }

    /** Throws a syntax error if the identifier is not a valid identifier */
    assertNoDot(): void {
        if (this.name.includes('.')) {
            throw new SyntaxError(`Identifier "${this.name}" contains dot`, null, this.name, this.location);
        }
    }

    /** add $ to js reserved keywords */
    safeName(): string {
        if (JS_RESERVED.has(this.name)) {
            return `$${this.name}`;
        }
        return this.name;
    }
}

/** String literal */
export class Literal extends Token {
    constructor(location: LocationRange, text: string) {
        super(location);
        this.value = text;
    }
    readonly value: string;
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return inspect(this.value, options);
    }
}

/** FieldType */
export type FieldType = BaseType | ContainerType | Identifier;

/** BaseType */
export class BaseType extends Token {
    constructor(location: LocationRange, readonly name: string) {
        super(location);
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return options.stylize(this.name, 'special');
    }
}

/** ContainerType */
export class ContainerType extends Token {
    constructor(location: LocationRange, readonly name: string, readonly types: FieldType[]) {
        super(location);
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `${options.stylize(this.name, 'special')}<${this.types.map((t) => inspect(t, options)).join(', ')}>`;
    }
}
