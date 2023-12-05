import path from 'node:path';
import {
    Const,
    ConstValue,
    type Definition,
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
import { CppInclude, type Header, Include, Namespace } from '../parser/header.js';
import { BaseType, ContainerType, type FieldType, Identifier, Token } from '../parser/token.js';
import { CompileError } from './errors.js';
import { isJsIdentifier } from '../util.js';
import pkgJson from '#package.json' assert { type: 'json' };

/** 解析的类型，其类型参数未解析 */
type ResolvedType = BaseType | ContainerType | Enum | Struct | Union | Exception | UNRESOLVED;

/** 表示未解析 */
class UNRESOLVED {
    readonly name = '<unresolved>';
    /** 名称 */
    safeName(): string {
        return this.name;
    }
}

/** Helper class for code generation */
export class Generator {
    constructor(readonly document: Document) {}

    /** result of generation */
    result = '';

    /** result of generation */
    hasError = false;
    /** 定义的别名，key 为 ts 名称 */
    private typeNames = new Map<string, ResolvedType>();
    /** 输出错误信息 */
    private printError(error: Error): void {
        this.hasError = true;
        this.document.printError(error);
    }

    /** 生成 Header */
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

    /** 生成表示 type 的 ts 类型 */
    private type(type: FieldType | UNRESOLVED): string {
        if (type instanceof BaseType) {
            if (type.name === 'void') return 'void';
            return `$.T${type.name[0].toUpperCase()}${type.name.slice(1)}`;
        }
        if (type instanceof ContainerType) {
            switch (type.name) {
                case 'map':
                    if (type.types.length !== 2) {
                        this.printError(new CompileError('map type must have 2 type parameters', type.location));
                        return `$.TMap<any, any>`;
                    } else {
                        return `$.TMap<${this.type(type.types[0])}, ${this.type(type.types[1])}>`;
                    }
                case 'set':
                    if (type.types.length !== 1) {
                        this.printError(new CompileError('set type must have 1 type parameter', type.location));
                        return `$.TSet<any>`;
                    } else {
                        return `$.TSet<${this.type(type.types[0])}>`;
                    }
                case 'list':
                    if (type.types.length !== 1) {
                        this.printError(new CompileError('list type must have 1 type parameter', type.location));
                        return `$.TList<any>`;
                    } else {
                        return `$.TList<${this.type(type.types[0])}>`;
                    }
                default:
                    this.printError(new CompileError(`unknown container type ${type.name}`, type.location));
                    return `${type.name}<${type.types.map((t) => this.type(t)).join(', ')}>`;
            }
        }
        return type.safeName();
    }
    /** 解析 typedef 定义的别名 */
    private resolve(type: FieldType | UNRESOLVED): ResolvedType {
        if (type instanceof UNRESOLVED) return type;
        if (type instanceof BaseType || type instanceof ContainerType) {
            return type;
        }
        return this.typeNames.get(type.safeName()) ?? new UNRESOLVED();
    }

    /** 使用 content 的值构造 type 类型的实例 */
    private construct(content: string, type: FieldType | UNRESOLVED): string {
        const resolved = this.resolve(type);
        if (resolved instanceof BaseType) {
            return `${this.type(type)}(${content})`;
        }
        if (resolved instanceof ContainerType) {
            if (resolved.name === 'list') return `${this.type(type)}.from(${content})`;
            return `new ${this.type(type)}(${content})`;
        }
        return `new ${this.type(type)}(${content})`;
    }

    /** 生成常量的表示 */
    private constValue(constValue: ConstValue, type: FieldType, mode: 'literal' | 'inspect' = 'literal'): string {
        const printKey = (key: unknown): string => {
            if (key instanceof Identifier) {
                return key.safeName();
            }
            const k = String(key);
            if (isJsIdentifier(k)) return k;
            return `'${k.replace(/'/g, "\\'")}'`;
        };
        const print = (value: ConstValue['value'], type: FieldType | UNRESOLVED, indent: string): string => {
            if (value == null) return 'null';
            if (value instanceof Identifier) return value.safeName();

            const resolved = this.resolve(type);
            if (Array.isArray(value)) {
                if (resolved instanceof ContainerType && (resolved.name === 'list' || resolved.name === 'set')) {
                    const itemType = resolved.types[0];
                    switch (resolved.name) {
                        case 'list':
                            if (mode === 'inspect')
                                return `${type.name}(${value.length}) {${value
                                    .map((v) => print(v, itemType, ''))
                                    .join(', ')}}`;
                            else return `[${value.map((v) => print(v, itemType, '')).join(', ')}]`;
                        case 'set':
                            if (mode === 'inspect')
                                return `${type.name}(${value.length}) {${value
                                    .map((v) => print(v, itemType, ''))
                                    .join(', ')}}`;
                            else
                                return this.construct(`[${value.map((v) => print(v, itemType, '')).join(', ')}]`, type);
                    }
                }
                this.printError(new CompileError(`Invalid list constant for type ${type.name}`, constValue.location));
            } else if (value instanceof Map) {
                if (resolved instanceof ContainerType && resolved.name === 'map') {
                    const [keyType, valueType] = resolved.types;
                    if (mode === 'inspect') {
                        return `${type.name}(${value.size}) {${[...value]
                            .map(([k, v]) => `${print(k, keyType, '')} => ${print(v, valueType, '')}`)
                            .join(', ')}}`;
                    } else {
                        return this.construct(
                            `[${[...value]
                                .map(([k, v]) => `[${print(k, keyType, '')}, ${print(v, valueType, '')}]`)
                                .join(', ')}]`,
                            type,
                        );
                    }
                }

                if (resolved instanceof Struct || resolved instanceof Union || resolved instanceof Exception) {
                    const map = `{
${[...value]
    .map(([k, v]) => {
        const key = k instanceof Identifier ? k.name : String(k);
        const f = resolved.fields.find((f) => f.name.name === key);
        return `${indent}    ${printKey(key)}: ${print(v, f?.type ?? new UNRESOLVED(), indent + '    ')},`;
    })
    .join('\n')}
${indent}}`;
                    if (mode === 'inspect') {
                        return `${type.name} ${map}`;
                    } else {
                        return this.construct(map, type);
                    }
                }
                this.printError(new CompileError(`Invalid map constant for type ${type.name}`, constValue.location));
            } else {
                if (!(resolved instanceof BaseType)) {
                    this.printError(
                        new CompileError(`Invalid constant value for type ${type.name}`, constValue.location),
                    );
                }
                const literal = typeof value == 'bigint' ? `${value}n` : JSON.stringify(value);
                return mode === 'literal' ? this.construct(literal, type) : literal;
            }
            return JSON.stringify(value);
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

    private fieldCreation(f: Field, indent = ''): string {
        let doc = f.doc ?? '';
        if (f.def != null) {
            doc += `\n@default ${this.constValue(f.def, f.type, 'inspect')}`;
        }
        return `${this.jsdoc(doc, indent)}
${indent}${f.name.safeName()}${f.required !== true ? '?' : ''}: $.TData<${this.type(f.type)}>;`;
    }
    private field(f: Field, indent = ''): string {
        let doc = f.doc ?? '';
        if (f.def != null) {
            doc += `\n@default ${this.constValue(f.def, f.type, 'inspect')}`;
        }
        return `${this.jsdoc(doc, indent)}
${indent}${f.name.safeName()}${f.required !== true ? '?' : ''}: ${this.type(f.type)};`;
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

    /** 生成枚举值 */
    private enumValue(e: EnumValue, indent = ''): string {
        return `${this.jsdoc(e.doc, indent)}
${indent}${e.name.safeName()}${e.value != null ? ` = ${e.value}` : ''},`;
    }

    /** 生成枚举定义 */
    private enum(e: Enum): string {
        return `
${this.jsdoc(e.doc)}
export enum ${e.name.safeName()} {
${e.values.map((f) => this.enumValue(f, '    ')).join('\n')}
}
`;
    }

    /** 生成 typedef 定义 */
    private typedef(t: Typedef): string {
        const newType = t.name.safeName();
        const oldType = this.type(t.type);
        return `
${this.jsdoc(t.doc)}
export type ${newType} = ${oldType};
export const ${newType} = ${oldType};
`;
    }

    /** 生成结构定义 */
    private struct(s: Struct): string {
        return `
${this.jsdoc(s.doc)}
export class ${s.name.safeName()} extends $.TStruct {
    constructor(data: {
${s.fields.map((f) => this.fieldCreation(f, '        ')).join('\n')}
    }) {
        super();
${s.fields.map((f) => this.fieldInit(f, '        ')).join('\n')}
    }
${s.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    /** 生成联合定义 */
    private union(u: Union): string {
        const name = u.name.safeName();
        const baseName = `${name}$Base$`;
        const unionName = (f: Field): string => `${name}$${f.name.safeName()}`;
        return `
${this.jsdoc(u.doc)}
class ${baseName} extends $.TUnion {
    constructor(data: {
${u.fields.map((f) => this.fieldCreation(f, '        ')).join('\n')}
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
${this.fieldCreation(f, '        ')}
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
    new (data: $.TData<typeof ${unionName(f)}>): ${unionName(f)};`,
    )
    .join('\n')}
    new (data: $.TData<typeof ${baseName}>): ${name};
    readonly prototype: ${name};
};
`;
    }

    /** 生成异常定义 */
    private exception(e: Exception): string {
        return `
${this.jsdoc(e.doc)}
export class ${e.name.safeName()} extends $.TException {
    constructor(data: {
${e.fields.map((f) => this.fieldCreation(f, '        ')).join('\n')}
    }) {
        super();
${e.fields.map((f) => this.fieldInit(f, '        ')).join('\n')}
    }
${e.fields.map((f) => this.field(f, '    ')).join('\n')}
}
`;
    }

    /** 生成方法定义 */
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

    /** 生成服务定义 */
    private service(s: Service): string {
        const base = s.base ? s.base.name : `$.TService`;
        return `
${this.jsdoc(s.doc)}
export abstract class ${s.name.safeName()} extends ${base} {
${s.methods.map((m) => this.method(m, '    ')).join('\n')}
}
`;
    }

    /** 生成常量定义 */
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

    /** 生成头部 */
    private banner(): string {
        const comments = [
            `Autogenerated by @cloudpss/rpc ${pkgJson.version}`,
            `On ${new Date().toISOString()}`,
            `Do not edit this file manually`,
        ];
        const width = comments.reduce((w, c) => Math.max(w, c.length), 0);
        const empty = '/*' + '*'.repeat(width + 2) + '*/';

        return `${empty}
${comments
    .map((c) => {
        const empty = width - c.length;
        const left = Math.floor(empty / 2);
        return `/* ${' '.repeat(left)}${c.padEnd(width - left)} */`;
    })
    .join('\n')}
${empty}

/* eslint-disable */

import * as $ from '@cloudpss/rpc/types';
`;
    }

    /** run generate procedure */
    generate(): void {
        this.result = this.banner();
        for (const h of this.document.headers) {
            this.result += this.header(h);
        }
        {
            for (const i of [Enum, Union, Struct, Exception]) {
                for (const def of this.document.definitions) {
                    if (!(def instanceof i)) continue;
                    this.typeNames.set(def.name.safeName(), def);
                }
            }
            const typeDefs = this.document.definitions.filter((def): def is Typedef => def instanceof Typedef);
            const typeDefCount = typeDefs.length;
            for (let loop = 0; loop < typeDefCount; loop++) {
                for (const def of typeDefs.splice(0)) {
                    const newType = def.name.safeName();
                    const oldType = this.resolve(def.type);
                    if (oldType instanceof UNRESOLVED) {
                        typeDefs.push(def);
                        continue;
                    }
                    this.typeNames.set(newType, oldType);
                }
            }
            for (const def of typeDefs) {
                const newType = def.name.safeName();
                const oldType = this.resolve(def.type);
                this.typeNames.set(newType, oldType);
            }
        }
        for (const i of [Enum, Union, Struct, Exception, Typedef, Const, Service]) {
            for (const def of this.document.definitions) {
                if (!(def instanceof i)) continue;
                this.result += this.definition(def);
            }
        }
    }
}
