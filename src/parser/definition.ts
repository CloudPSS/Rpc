import type { LocationRange } from 'peggy';
import { inspect, InspectOptionsStylized } from 'node:util';
import { inspectDoc } from './utils.js';
import { Literal, Token, type FieldType, type Identifier } from './token.js';

export class ConstValue extends Token {
    static unwrap(value: unknown): unknown {
        if (value instanceof ConstValue) {
            return this.unwrap(value.value);
        }
        if (value instanceof Literal) {
            return value.value;
        }
        if (Array.isArray(value)) {
            return value.map((v) => this.unwrap(v));
        }
        if (value instanceof Map) {
            const map = new Map();
            for (const [k, v] of value) {
                map.set(this.unwrap(k), this.unwrap(v));
            }
            return map;
        }
        return value;
    }

    constructor(location: LocationRange, readonly value: unknown) {
        super(location);
        this.value = ConstValue.unwrap(value);
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return inspect(this.value, options);
    }
}

export class Field extends Token {
    constructor(
        location: LocationRange,
        readonly id: number | undefined,
        readonly required: boolean | null,
        readonly type: FieldType,
        readonly name: Identifier,
        readonly def?: ConstValue,
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        const r = options.stylize(this.required === null ? '' : this.required ? ' required' : ' optional', 'special');
        const d = this.def != null ? ` = ${inspect(this.def, options)}` : '';
        return `${options.stylize(String(this.id ?? '?'), 'number')}:${r} ${inspect(this.type, options)} ${inspect(
            this.name,
            options,
        )}${d}${inspectDoc(this, options)}`;
    }
}

export class Const extends Token {
    constructor(
        location: LocationRange,
        readonly type: FieldType,
        readonly name: Identifier,
        readonly value: ConstValue,
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `Const(${inspect(this.type, options)} ${inspect(this.name, options)}) = ${inspect(
            this.value,
            options,
        )}${inspectDoc(this, options)}`;
    }
}
export class EnumValue extends Token {
    constructor(
        location: LocationRange,
        readonly name: Identifier,
        readonly value: number | null,
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        if (this.value == null) return inspect(this.name, options);
        return `${inspect(this.name, options)} = ${inspect(this.value, options)}`;
    }
}
export class Enum extends Token {
    constructor(
        location: LocationRange,
        readonly name: Identifier,
        readonly values: EnumValue[],
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `Enum(${inspect(this.name, options)}) ${inspect(this.values, options)}`;
    }
}

export class StructLike extends Token {
    constructor(location: LocationRange, readonly name: Identifier, readonly fields: Field[], readonly doc?: string) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `${this.constructor.name}(${inspect(this.name, options)})${inspectDoc(this, options)} ${inspect(
            this.fields,
            options,
        )}`;
    }
}

export class Struct extends StructLike {}
export class Exception extends StructLike {}
export class Union extends StructLike {}

export class Service extends Token {
    constructor(
        location: LocationRange,
        readonly name: Identifier,
        readonly base: Identifier | null,
        readonly methods: Method[],
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        const base = this.base != null ? ` extends ${inspect(this.base, options)}` : '';
        return `Service(${inspect(this.name, options)}${base})${inspectDoc(this, options)} ${inspect(
            this.methods,
            options,
        )}`;
    }
}

export class Method extends Token {
    constructor(
        location: LocationRange,
        readonly result: FieldType,
        readonly name: Identifier,
        readonly params: Field[],
        readonly throws: Field[] | null,
        readonly oneway: boolean,
        readonly doc?: string,
    ) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        const r = `${options.stylize(this.oneway ? 'oneway ' : '', 'special')}${inspect(this.result, options)}`;
        const params = this.params.length > 0 ? this.params.map((p) => inspect(p, options)).join(', ') : '';
        const t = this.throws != null ? ` throws (${this.throws.map((t) => inspect(t, options)).join(', ')})` : '';
        return `${r} ${inspect(this.name, options)}(${params})${t}${inspectDoc(this, options)}`;
    }
}

export class Typedef extends Token {
    constructor(location: LocationRange, readonly name: Identifier, readonly type: FieldType, readonly doc?: string) {
        super(location);
        name.assertNoDot();
    }
    /** @inheritdoc */
    override [inspect.custom](depth: number, options: InspectOptionsStylized): string {
        return `Typedef(${inspect(this.name, options)}) = ${inspect(this.type, options)}`;
    }
}

/** Definition directives */
export type Definition = Const | Typedef | Enum | Struct | Union | Exception | Service;
