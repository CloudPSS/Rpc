import { BaseTypeName } from '../constants.js';
import {
    Const,
    ConstValue,
    Definition,
    Enum,
    EnumValue,
    Exception,
    Field,
    Service,
    Struct,
    Typedef,
    Union,
} from '../parser/definition.js';
import type { Document } from '../parser/document.js';
import { CppInclude, Header, Include, Namespace } from '../parser/header.js';
import { ContainerType, FieldType, Identifier } from '../parser/token.js';
import { CompileError } from './errors.js';

/** Helper class for code generation */
export class Generator {
    constructor(readonly document: Document) {}

    /** result of generation */
    result = '';

    /** result of generation */
    hasError = false;

    private printError(error: Error): void {
        this.hasError = true;
        this.document.printError(error);
    }

    private header(header: Header): string {
        if (header instanceof Include) {
            this.printError(new CompileError('include is not supported', header.location));
            return '';
        }
        if (header instanceof CppInclude) {
            return '';
        }
        if (header instanceof Namespace) {
            // useless for es modules
            return '';
        }
        throw new CompileError('unknown header', (header as Header).location);
    }

    private type(type: FieldType, wrap = false): string {
        if (BaseTypeName.includes(type.name as BaseTypeName)) {
            return `T${type.name[0].toUpperCase()}${type.name.slice(1)}`;
        }
        if (type instanceof ContainerType) {
            let t;
            switch (type.name) {
                case 'map':
                    if (type.types.length !== 2)
                        throw new CompileError('map type must have 2 type parameters', type.location);
                    t = `Map<${this.type(type.types[0])}, ${this.type(type.types[1])}>`;
                    break;
                case 'set':
                    if (type.types.length !== 1)
                        throw new CompileError('set type must have 1 type parameter', type.location);
                    t = `Set<${this.type(type.types[0])}>`;
                    break;
                case 'list':
                    if (type.types.length !== 1)
                        throw new CompileError('list type must have 1 type parameter', type.location);
                    t = `Array<${this.type(type.types[0])}>`;
                    break;
                default:
                    throw new CompileError(`unknown container type ${type.name}`, type.location);
            }
            return wrap ? `RequiredData<${t}>` : t;
        } else {
            return wrap ? `RequiredData<typeof ${type.name}>` : type.name;
        }
    }
    private constValue(constValue: ConstValue, type: FieldType, mode: 'literal' | 'inspect' = 'literal'): string {
        const printKey = (key: unknown): string => {
            if (typeof key != 'string') {
                throw new CompileError(`Invalid constants value for container type ${type.name}`, constValue.location);
            }
            if (key === '') return "''";
            if (/[_a-z][_a-z0-9]*/i.test(key)) return key;
            return `'${key.replace(/'/g, "\\'")}'`;
        };
        const print = (value: unknown, type: FieldType): string => {
            if (value == null) return 'null';
            if (value instanceof Identifier) return value.name;
            if (typeof value != 'object') return JSON.stringify(value);
            if (Array.isArray(value)) {
                if (type instanceof ContainerType) {
                    switch (type.name) {
                        case 'list':
                            return `[${value.map((v) => print(v, type.types[0])).join(', ')}]`;
                        case 'set':
                            if (mode === 'inspect')
                                return `Set(${value.length}) {${value.map((v) => print(v, type.types[0])).join(', ')}}`;
                            else
                                return `new Set<${this.type(type.types[0])}>([${value
                                    .map((v) => print(v, type.types[0]))
                                    .join(', ')}])`;
                        default:
                            throw new CompileError(
                                `Invalid constants value for container type ${type.name}`,
                                constValue.location,
                            );
                    }
                }
                throw new CompileError(`Invalid constants value for type ${type.name}`, constValue.location);
            }
            if (value instanceof Map) {
                if (type instanceof ContainerType) {
                    if (type.name !== 'map')
                        throw new CompileError(
                            `Invalid constants value for container type ${type.name}`,
                            constValue.location,
                        );
                    if (mode === 'inspect') {
                        return `Map(${value.size}) {${[...value]
                            .map(([k, v]) => `${print(k, type.types[0])} => ${print(v, type.types[1])}`)
                            .join(', ')}}`;
                    } else {
                        return `new Map<${this.type(type.types[0])}, ${this.type(type.types[1])}>([${[...value]
                            .map(([k, v]) => `[${print(k, type.types[0])}, ${print(v, type.types[1])}]`)
                            .join(', ')}])`;
                    }
                }

                const map = `{
${[...value].map(([k, v]) => `    ${printKey(k)}: ${print(v, type)},`).join('\n')}
}`;
                if (mode === 'inspect') {
                    return `${type.name} ${map}`;
                } else {
                    return `new ${type.name}(${map})`;
                }
            }
            throw new CompileError(`Invalid constants value`, constValue.location);
        };

        return print(constValue.value, type);
    }
    private jsdoc(doc: string | undefined, indent = ''): string {
        if (!doc) return '';

        const lines = doc.split('\n');
        if (lines.length === 1) return `${indent}/** ${lines[0]} */`;
        return `${indent}/** 
${lines.map((line) => `${indent} * ${line}`).join('\n')}
${indent} */`;
    }

    private field(f: Field, indent = '', wrap = false): string {
        let doc = f.doc ?? '';
        if (f.def != null) {
            doc += `\n@default ${this.constValue(f.def, f.type, 'inspect')}`;
        }
        return `${this.jsdoc(doc, indent)}
${indent}${f.name.name}${f.required !== true ? '?' : ''}: ${this.type(f.type, wrap)};`;
    }

    private enumValue(e: EnumValue, indent = ''): string {
        return `${this.jsdoc(e.doc, indent)}
${indent}${e.name.name}${e.value != null ? ` = ${e.value}` : ''},`;
    }

    private enum(e: Enum): string {
        return `
${this.jsdoc(e.doc)}
export enum ${e.name.name} {
${e.values.map((f) => this.enumValue(f, '    ')).join('\n')}
}
`;
    }

    private typedef(t: Typedef): string {
        return `
${this.jsdoc(t.doc)}
export type ${t.name.name} = ${this.type(t.type)};
`;
    }

    private struct(s: Struct): string {
        return `
${this.jsdoc(s.doc)}
export class ${s.name.name} {
    constructor(data: {
${s.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) {

        super(data);
    }
${s.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    private union(u: Union): string {
        const name = u.name.name;
        const baseName = `${name}$$Base`;
        const unionName = (f: Field): string => `${name}$${f.name.name}`;
        return `
${this.jsdoc(u.doc)}
class ${baseName} {
    constructor(data: {
${u.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) { }
}
${u.fields
    .map(
        (f) => `${this.jsdoc(f.doc)}
class ${unionName(f)} extends ${baseName} {
    constructor(data: {
${this.field(f, '        ', true)}
    }) {
        super(data);
     }
${this.field(f, '    ')}
}`,
    )
    .join('\n')}
    
${this.jsdoc(u.doc)}
export type ${name} = ${u.fields.map(unionName).join(' | ')};
export const ${name} = ${baseName} as {
${u.fields
    .map(
        (f) => `${this.jsdoc(f.doc, '    ')}
    new (data: RequiredData<typeof ${unionName(f)}>): ${unionName(f)};`,
    )
    .join('\n')}
    new (data: RequiredData<typeof ${baseName}>): ${name};
    readonly prototype: ${name};
};
`;
    }

    private exception(e: Exception): string {
        return `
${this.jsdoc(e.doc)}
export class ${e.name.name} extends TException {
    constructor(data: {
${e.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) {
        super();
    }
${e.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    private service(s: Service): string {
        return `
${this.jsdoc(s.doc)}
class ${s.name.name} {}
`;
    }

    private const(c: Const): string {
        return `
${this.jsdoc(c.doc)}
export const ${c.name.name}: ${this.type(c.type)} = ${this.constValue(c.value, c.type)};
`;
    }

    private definition(def: Definition): string {
        if (def instanceof Typedef) {
            return this.typedef(def);
        }
        if (def instanceof Enum) {
            return this.enum(def);
        }
        if (def instanceof Union) {
            return this.union(def);
        }
        if (def instanceof Struct) {
            return this.struct(def);
        }
        if (def instanceof Exception) {
            return this.exception(def);
        }
        if (def instanceof Const) {
            return this.const(def);
        }
        if (def instanceof Service) {
            return this.service(def);
        }
        throw new CompileError(`Unknown definition`, (def as Definition).location);
    }

    private banner(): string {
        const comments = [
            `Autogenerated on ${new Date().toISOString()} with @cloudpss/rpc ${
                process.env['npm_package_version'] ?? ''
            }`.trim(),
            `Do not edit this file manually`,
        ];
        const width = comments.reduce((w, c) => Math.max(w, c.length), 0);
        const empty = '/*' + '*'.repeat(width + 2) + '*/';

        return `${empty}
${comments
    .map((c) => {
        const r = width - c.length;
        return `/* ${' '.repeat(r / 2)}${c.padEnd(width - r / 2)} */`;
    })
    .join('\n')}
${empty}
/* eslint-disable */

import {
    TBool,
    TByte,
    TI8,
    TI16,
    TI32,
    TI64,
    TDouble,
    TString,
    TBinary,
    RequiredData,
    TException,
} from '../dist/types';
`;
    }

    /** run generate procedure */
    generate(): void {
        this.result = this.banner();
        for (const h of this.document.headers) {
            this.result += this.header(h);
        }
        for (const i of [Typedef, Enum, Union, Struct, Exception, Const, Service]) {
            for (const def of this.document.definitions) {
                if (!(def instanceof i)) continue;
                this.result += this.definition(def);
            }
        }
    }
}
