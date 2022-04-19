import type { LocationRange } from 'peggy';
import { inspect, InspectOptionsStylized } from 'node:util';

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
    }
    /** @inheritdoc */
    protected override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return options.stylize(this.name, 'symbol');
    }
}

/** String literal */
export class Literal extends Token {
    /** parse Literal */
    private static parse(text: string): string {
        const t = text.slice(1, -1);
        try {
            const parsed = JSON.parse(`"${t}"`) as unknown;
            if (typeof parsed === 'string') {
                return parsed;
            }
        } catch {
            // ignore
        }
        return t;
    }
    constructor(location: LocationRange, text: string) {
        super(location);
        this.value = Literal.parse(text);
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
