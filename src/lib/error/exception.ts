const kException = Symbol('exception');
/**
 * Exceptions defined in the Thrift IDL file.
 */
export abstract class Exception extends Error {
    constructor(...args: ConstructorParameters<typeof Error>) {
        super(...args);
        this[kException] = new.target;
    }
    readonly [kException]: typeof Exception;
}
