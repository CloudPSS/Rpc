import path from 'node:path';
import {
    Const,
    ConstValue,
    Definition,
    Enum,
    EnumValue,
    Exception,
    Field,
    Method,
    Service,
    Struct,
    Typedef,
    Union,
} from '../parser/definition.js';
import type { Document } from '../parser/document.js';
import { CppInclude, Header, Include, Namespace } from '../parser/header.js';
import { BaseType, ContainerType, FieldType, Identifier, Token } from '../parser/token.js';
import { CompileError } from './errors.js';
import { isJsIdentifier } from '../util.js';

/** Helper class for code generation */
export class Generator {
    constructor(readonly document: Document) {}

    /** result of generation */
    result = '';

    /** result of generation */
    hasError = false;

    private baseTypes = new Map<string, BaseType>();
    private containerTypes = new Map<string, ContainerType>();

    private printError(error: Error): void {
        this.hasError = true;
        this.document.printError(error);
    }

    private header(header: Header): string {
        if (header instanceof Include) {
            const file = header.path.value;
            const baseName = path.basename(file, '.thrift');

            return `
/** From ${file} */
import * as ${baseName} from ${JSON.stringify(file + '.js')};
`;
        }
        if (header instanceof CppInclude) {
            return '';
        }
        if (header instanceof Namespace) {
            // useless for es modules
            return '';
        }
        this.printError(new CompileError('unknown header', (header as Header).location));
        return '';
    }

    private type(type: FieldType, wrap = false): string {
        if (type instanceof BaseType) {
            if (type.name === 'void') return 'void';
            return `T${type.name[0].toUpperCase()}${type.name.slice(1)}`;
        }
        if (type instanceof ContainerType) {
            let t;
            switch (type.name) {
                case 'map':
                    if (type.types.length !== 2) {
                        this.printError(new CompileError('map type must have 2 type parameters', type.location));
                        t = `TMap<any, any>`;
                    } else {
                        t = `TMap<${this.type(type.types[0])}, ${this.type(type.types[1])}>`;
                    }
                    break;
                case 'set':
                    if (type.types.length !== 1) {
                        this.printError(new CompileError('set type must have 1 type parameter', type.location));
                        t = `TSet<any>`;
                    } else {
                        t = `TSet<${this.type(type.types[0])}>`;
                    }
                    break;
                case 'list':
                    if (type.types.length !== 1) {
                        this.printError(new CompileError('list type must have 1 type parameter', type.location));
                        t = `TList<any>`;
                    } else {
                        t = `TList<${this.type(type.types[0])}>`;
                    }
                    break;
                default:
                    this.printError(new CompileError(`unknown container type ${type.name}`, type.location));
                    t = `${type.name}<${type.types.map((t) => this.type(t)).join(', ')}>`;
                    break;
            }
            return wrap ? `TData<${t}>` : t;
        }
        if (this.baseTypes.has(type.safeName())) return type.safeName();
        if (this.containerTypes.has(type.safeName())) return wrap ? `TData<${type.safeName()}>` : type.safeName();
        return wrap ? `TData<typeof ${type.safeName()}>` : type.safeName();
    }
    private construct(content: string, type: FieldType): string {
        if (type instanceof BaseType) {
            return `${this.type(type)}(${content})`;
        }
        if (type instanceof ContainerType) {
            if (type.name === 'list') return `TList.from<${this.type(type.types[0])}>(${content})`;
            return `new ${this.type(type)}(${content})`;
        }
        if (this.containerTypes.get(type.safeName())?.name === 'list') {
            return `${this.type(type)}.from(${content})`;
        }
        if (this.baseTypes.has(type.safeName())) {
            return `${this.type(type)}(${content})`;
        }
        return `new ${this.type(type)}(${content})`;
    }
    private constValue(constValue: ConstValue, type: FieldType, mode: 'literal' | 'inspect' = 'literal'): string {
        const printKey = (key: unknown): string => {
            if (key instanceof Identifier) {
                return `[${key.safeName()}]`;
            }
            if (typeof key != 'string') {
                this.printError(
                    new CompileError(
                        `Invalid constants value for container type ${type.name}`,
                        (key instanceof Token ? key : constValue).location,
                    ),
                );
            }
            const k = String(key);
            if (isJsIdentifier(k)) return k;
            return `'${k.replace(/'/g, "\\'")}'`;
        };
        const print = (value: unknown, type: FieldType | null, indent: string): string => {
            if (value == null) return 'null';
            if (value instanceof Identifier) return value.safeName();
            if (typeof value != 'object') {
                if (
                    type instanceof ContainerType ||
                    (type instanceof Identifier && this.containerTypes.get(type.safeName()))
                ) {
                    this.printError(
                        new CompileError(
                            `Invalid constants value for container type ${type.name}`,
                            constValue.location,
                        ),
                    );
                    return JSON.stringify(value);
                }
                const base = type instanceof BaseType ? type.name : this.baseTypes.get(type?.safeName() ?? '')?.name;
                if (type && base === 'binary') {
                    return this.construct(JSON.stringify(value), type);
                }
                return JSON.stringify(value);
            }
            if (Array.isArray(value)) {
                const containerType = type instanceof ContainerType ? type : this.containerTypes.get(type.name);
                if (containerType == null)
                    throw new CompileError(`Invalid list constant for type ${type.name}`, constValue.location);
                switch (containerType.name) {
                    case 'list':
                        return `[${value.map((v) => print(v, containerType.types[0])).join(', ')}]`;
                    case 'set':
                        if (mode === 'inspect')
                            return `Set(${value.length}) {${value
                                .map((v) => print(v, containerType.types[0]))
                                .join(', ')}}`;
                        else
                            return `new TSet<${this.type(containerType.types[0])}>([${value
                                .map((v) => print(v, containerType.types[0]))
                                .join(', ')}])`;
                    default:
                        throw new CompileError(`Invalid list constant for type ${type.name}`, constValue.location);
                }
            }
            if (value instanceof Map) {
                if (type instanceof BaseType)
                    throw new CompileError(`Invalid constants value for base type ${type.name}`, constValue.location);
                const containerType =
                    type instanceof ContainerType ? type : this.containerTypes.get(type?.safeName() ?? '');
                if (type && containerType) {
                    if (containerType.name !== 'map')
                        throw new CompileError(
                            `Invalid map constant for container type ${type.name}`,
                            constValue.location,
                        );
                    if (mode === 'inspect') {
                        return `Map(${value.size}) {${[...value]
                            .map(
                                ([k, v]) =>
                                    `${print(k, containerType.types[0], '')} => ${print(
                                        v,
                                        containerType.types[1],
                                        '',
                                    )}`,
                            )
                            .join(', ')}}`;
                    } else {
                        return `new TMap<${this.type(containerType.types[0])}, ${this.type(containerType.types[1])}>([
${[...value]
    .map(
        ([k, v]) =>
            `${indent}    [${print(k, containerType.types[0], indent + '    ')}, ${print(
                v,
                containerType.types[1],
                indent + '    ',
            )}],`,
    )
    .join('\n')}
${indent}])`;
                    }
                }

                const map = `{
${[...value].map(([k, v]) => `${indent}    ${printKey(k)}: ${print(v, null, indent + '    ')},`).join('\n')}
${indent}}`;
                if (!(type instanceof Identifier)) return map;
                if (mode === 'inspect') {
                    return `${type.safeName()} ${map}`;
                } else {
                    return `new ${type.safeName()}(${map})`;
                }
            }
            throw new CompileError(`Invalid constants value`, constValue.location);
        };

        return print(constValue.value, type, '');
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
${indent}${f.name.safeName()}${f.required !== true ? '?' : ''}: ${this.type(f.type, wrap)};`;
    }

    private fieldInit(f: Field, indent = ''): string {
        const n = f.name.safeName();
        if (f.def != null) {
            return `${indent}if (data.${n} != null)
${indent}    this.${n} = ${this.construct(`data.${n}`, f.type)};
${indent}else
${indent}    this.${n} = ${this.constValue(f.def, f.type)};`;
        }
        if (f.required === true) {
            return `${indent}if (data.${n} != null)
${indent}    this.${n} = ${this.construct(`data.${n}`, f.type)};
${indent}else
${indent}    throw new Error('Missing required field ${n}');`;
        }
        return `${indent}if (data.${n} != null)
${indent}    this.${n} = ${this.construct(`data.${n}`, f.type)};`;
    }

    private enumValue(e: EnumValue, indent = ''): string {
        return `${this.jsdoc(e.doc, indent)}
${indent}${e.name.safeName()}${e.value != null ? ` = ${e.value}` : ''},`;
    }

    private enum(e: Enum): string {
        return `
${this.jsdoc(e.doc)}
export enum ${e.name.safeName()} {
${e.values.map((f) => this.enumValue(f, '    ')).join('\n')}
}
`;
    }

    private typedefInit(t: Typedef): void {
        const newType = t.name.safeName();
        if (t.type instanceof BaseType) {
            this.baseTypes.set(newType, t.type);
        } else if (t.type instanceof ContainerType) {
            this.containerTypes.set(newType, t.type);
        } else if (this.baseTypes.has(t.type.safeName())) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.baseTypes.set(newType, this.baseTypes.get(t.type.name)!);
        } else if (this.containerTypes.has(t.type.safeName())) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.containerTypes.set(newType, this.containerTypes.get(t.type.name)!);
        }
    }

    private typedef(t: Typedef): string {
        const newType = t.name.safeName();
        const oldType = this.type(t.type);
        let oldValue = oldType;
        const typeParams = /<(.+)>$/.exec(oldType);
        if (typeParams) {
            oldValue = oldValue.replace(/<(.+)>$/, '');
            switch (oldValue) {
                case 'TMap':
                    oldValue = `TMap as TMapConstructor<${typeParams[1]}, ${newType}>`;
                    break;
                case 'TSet':
                    oldValue = `TSet as TSetConstructor<${typeParams[1]}, ${newType}>`;
                    break;
                case 'TList':
                    oldValue = `TList as TListConstructor<${typeParams[1]}, ${newType}>`;
                    break;
                default:
                    throw new CompileError(`Invalid type ${oldValue}`, t.location);
            }
        }
        return `
${this.jsdoc(t.doc)}
export type ${newType} = ${oldType};
export const ${newType} = ${oldValue};
`;
    }

    private struct(s: Struct): string {
        return `
${this.jsdoc(s.doc)}
export class ${s.name.safeName()} extends TStruct {
    constructor(data: {
${s.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) {
        super();
${s.fields.map((f) => this.fieldInit(f, '        ')).join('\n')}
    }
${s.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    private union(u: Union): string {
        const name = u.name.safeName();
        const baseName = `${name}$$Base`;
        const unionName = (f: Field): string => `${name}$${f.name.safeName()}`;
        return `
${this.jsdoc(u.doc)}
class ${baseName} extends TUnion {
    constructor(data: {
${u.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) {
        if (new.target === ${baseName}) {
${u.fields
    .map((f) => `            if (data.${f.name.safeName()} !== undefined) return new ${unionName(f)}(data);`)
    .join('\n')}
            throw new Error('Invalid union data');
        }
        super();
    }
}
${u.fields
    .map(
        (f) => `${this.jsdoc(f.doc)}
class ${unionName(f)} extends ${baseName} {
    constructor(data: {
${this.field(f, '        ', true)}
    }) {
        super(data);
${this.fieldInit(f, '        ')}
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
    new (data: TData<typeof ${unionName(f)}>): ${unionName(f)};`,
    )
    .join('\n')}
    new (data: TData<typeof ${baseName}>): ${name};
    readonly prototype: ${name};
};
`;
    }

    private exception(e: Exception): string {
        return `
${this.jsdoc(e.doc)}
export class ${e.name.safeName()} extends TException {
    constructor(data: {
${e.fields.map((f) => this.field(f, '        ', true)).join('\n')}
    }) {
        super();
${e.fields.map((f) => this.fieldInit(f, '        ')).join('\n')}
    }
${e.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    private method(m: Method, indent: string): string {
        const args = m.params.map((a) => `${a.name.safeName()}: ${this.type(a.type)}`).join(', ');
        let retType = this.type(m.result);
        let throws = m.throws ?? [];
        if (m.oneway) {
            if (retType !== 'void') {
                this.printError(new CompileError(`Oneway method must return void`, m.result.location));
                retType = 'void';
            }
            if (throws.length > 0) {
                this.printError(
                    new CompileError(`Oneway method cannot throw exceptions`, {
                        start: throws[0].location.start,
                        end: throws[throws.length - 1].location.end,
                        source: m.location.source as unknown,
                    }),
                );
                throws = [];
            }
        }

        let doc = m.doc ?? '';
        if (m.params.length > 0) {
            doc += `
${m.params.map((t) => `@param ${t.name.name}${t.doc ? ` - ${t.doc}` : ''}`).join('\n')}`;
        }
        if (throws.length > 0) {
            doc += `
${throws.map((t) => `@throws {${this.type(t.type)}} ${t.name.name}${t.doc ? ` - ${t.doc}` : ''}`).join('\n')}`;
        }
        return `${this.jsdoc(doc, indent)}
${indent}abstract ${m.name.safeName()}(${args}): Promise<${retType}>;
`;
    }

    private service(s: Service): string {
        const base = s.base ? s.base.name : `TService`;
        return `
${this.jsdoc(s.doc)}
export abstract class ${s.name.safeName()} extends ${base} {
${s.methods.map((m) => this.method(m, '    ')).join('\n')}
}
`;
    }

    private const(c: Const): string {
        return `
${this.jsdoc(c.doc)}
export const ${c.name.safeName()}: ${this.type(c.type)} = ${this.constValue(c.value, c.type)};
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
    TMap,
    TMapConstructor,
    TSet,
    TSetConstructor,
    TList,
    TListConstructor,
    TData,
    TException,
    TStruct,
    TUnion,
    TService,
} from '../dist/types';
`;
    }

    /** run generate procedure */
    generate(): void {
        this.result = this.banner();
        for (const h of this.document.headers) {
            this.result += this.header(h);
        }
        for (const def of this.document.definitions) {
            if (!(def instanceof Typedef)) continue;
            this.typedefInit(def);
        }
        for (const i of [Enum, Union, Struct, Exception, Typedef, Const, Service]) {
            for (const def of this.document.definitions) {
                if (!(def instanceof i)) continue;
                this.result += this.definition(def);
            }
        }
    }
}
