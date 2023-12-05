import { inspect, type InspectOptionsStylized } from 'node:util';
import { MessageType, TType } from '../types.js';
import type { RawMessage, RawStruct, RawValue } from './interface.js';

/** inspect RawValue */
function inspectRawValue<T extends TType>(
    value: RawValue,
    type: T,
    depth: number,
    options: InspectOptionsStylized,
): string {
    const padding = '  '.repeat(depth);
    if (type === TType.struct) {
        const [name, fields] = value as RawStruct;
        const inspectedFields = [];
        for (const [id, name, type, value] of fields) {
            const iId = options.stylize(String(id), 'number');
            const iName = name ? ` (${options.stylize(name, 'string')})` : '';
            const iType = options.stylize(TType[type], 'special');
            const iValue = inspectRawValue(value, type, depth + 1, options);
            inspectedFields.push(`${padding}  [${iId}${iName}]: ${iType} = ${iValue}`);
        }
        const structHead = `${options.stylize('struct', 'special')} ${options.stylize(name, 'string')}${
            name ? ' ' : ''
        }`;
        if (inspectedFields.length) {
            return `${structHead}{\n${inspectedFields.join('\n')}\n${padding}}`;
        } else {
            return `${structHead}{}`;
        }
    }
    if (type === TType.list || type === TType.set) {
        const [elementType, elements] = value as [TType, RawValue[]];
        const inspectedElements = [];
        for (const element of elements) {
            const iElement = inspectRawValue(element, elementType, depth + 1, options);
            inspectedElements.push(`${padding}  ${iElement}`);
        }
        const listHead = `${options.stylize(TType[type], 'special')}<${options.stylize(
            TType[elementType],
            'special',
        )}> `;
        if (inspectedElements.length) {
            return `${listHead}[\n${inspectedElements.join('\n')}\n${padding}]`;
        } else {
            return `${listHead}[]`;
        }
    }
    if (type === TType.map) {
        const [keyType, valueType, keys, values] = value as [TType, TType, RawValue[], RawValue[]];
        const inspectedEntries = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];
            const iKey = inspectRawValue(key, keyType, depth + 1, options);
            const iValue = inspectRawValue(value, valueType, depth + 1, options);
            inspectedEntries.push(`${padding}  ${iKey} => ${iValue}`);
        }
        const mapHead = `${options.stylize(TType[type], 'special')}<${options.stylize(
            TType[keyType],
            'special',
        )}, ${options.stylize(TType[valueType], 'special')}> `;
        if (inspectedEntries.length) {
            return `${mapHead}{\n${inspectedEntries.join('\n')}\n${padding}}`;
        } else {
            return `${mapHead}{}`;
        }
    }
    return inspect(value, options);
}

/** inspect RawMessage */
function inspectRawMessage(message: RawMessage, depth: number, options: InspectOptionsStylized): string {
    const [type, seq, name, data] = message;
    const iType = options.stylize(MessageType[type], 'special');
    const iSeq = options.stylize(String(seq), 'number');
    const iName = options.stylize(name, 'string');
    return `${iType}(${iSeq}) ${iName} ${inspectRawValue(data, TType.struct, depth, options)}`;
}

/** Make message inspectable */
export function inspectableRawMessage<T extends RawMessage>(
    message: RawMessage,
): T & {
    /** inspect RawMessage */
    [inspect.custom](depth: number, options: InspectOptionsStylized): string;
} {
    Object.defineProperty(message, inspect.custom, {
        configurable: true,
        value: function (this: RawMessage, depth: number, options: InspectOptionsStylized) {
            return inspectRawMessage(this, depth - 1, options);
        },
    });
    return message as T & {
        /** inspect RawMessage */
        [inspect.custom](depth: number, options: InspectOptionsStylized): string;
    };
}
