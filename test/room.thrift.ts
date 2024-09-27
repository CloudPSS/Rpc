/****************************************************************/
/* Autogenerated on 2022-04-21T08:38:48.206Z with @cloudpss/rpc */
/*                Do not edit this file manually                */
/****************************************************************/
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
    TSet,
    TSetConstructor,
    TList,
    TListConstructor,
    TData,
    TException,
    TStruct,
    TUnion,
    TService,
} from '../dist/types.js';

/** From ./base.thrift */
import * as base from './base.thrift.js';
export { base };

/** test enum */
export enum E {
    a = 1,

    b = 1,

    c,
}

/** TestUnion */
class $Promise$$Base extends TUnion {
    constructor(data: {
        /** r */
        value?: TString;
        /** e */
        error?: TData<typeof RoomNotFoundException>;
    }) {
        if (new.target === $Promise$$Base) {
            if (data.value !== undefined) return new $Promise$value(data);
            if (data.error !== undefined) return new $Promise$error(data);
            throw new Error('Invalid union data');
        }
        super();
    }
}
/** r */
class $Promise$value extends $Promise$$Base {
    constructor(data: {
        /** r */
        value?: TString;
    }) {
        super(data);
        if (data.value != null) this.value = TString(data.value);
    }
    /** r */
    value?: TString;
}
/** e */
class $Promise$error extends $Promise$$Base {
    constructor(data: {
        /** e */
        error?: TData<typeof RoomNotFoundException>;
    }) {
        super(data);
        if (data.error != null) this.error = new RoomNotFoundException(data.error);
    }
    /** e */
    error?: RoomNotFoundException;
}

/** TestUnion */
export type $Promise = $Promise$value | $Promise$error;
export const $Promise = $Promise$$Base as {
    /** r */
    new (data: TData<typeof $Promise$value>): $Promise$value;
    /** e */
    new (data: TData<typeof $Promise$error>): $Promise$error;
    new (data: TData<typeof $Promise$$Base>): $Promise;
    readonly prototype: $Promise;
};

/**  rtc room info */
export class RoomInfo extends TStruct {
    constructor(data: {
        /**
         * id of room
         * @default a
         */
        id?: TString;
        /** expire time in epoch seconds */
        expires?: Date4;
        /** COTURN username */
        username: TString;
        /** COTURN password */
        password?: TString;

        scopes?: TData<SList>;

        scopes2?: TData<TList<TString>>;

        m?: TData<Dic>;

        m2?: TData<TMap<TString, TI32>>;

        testSet?: TData<SSet>;

        testSet2?: TData<TSet<E>>;

        error?: TData<typeof RoomNotFoundException>;

        aa?: TData<typeof base.aa>;
    }) {
        super();
        if (data.id != null) this.id = TString(data.id);
        else this.id = a;
        if (data.expires != null) this.expires = Date4(data.expires);
        if (data.username != null) this.username = TString(data.username);
        else throw new Error('Missing required field username');
        if (data.password != null) this.password = TString(data.password);
        if (data.scopes != null) this.scopes = SList.from(data.scopes);
        if (data.scopes2 != null) this.scopes2 = TList.from<TString>(data.scopes2);
        if (data.m != null) this.m = new Dic(data.m);
        if (data.m2 != null) this.m2 = new TMap<TString, TI32>(data.m2);
        if (data.testSet != null) this.testSet = new SSet(data.testSet);
        if (data.testSet2 != null) this.testSet2 = new TSet<E>(data.testSet2);
        if (data.error != null) this.error = new RoomNotFoundException(data.error);
        if (data.aa != null) this.aa = new base.aa(data.aa);
    }
    /**
     * id of room
     * @default a
     */
    id?: TString;
    /** expire time in epoch seconds */
    expires?: Date4;
    /** COTURN username */
    username: TString;
    /** COTURN password */
    password?: TString;

    scopes?: SList;

    scopes2?: TList<TString>;

    m?: Dic;

    m2?: TMap<TString, TI32>;

    testSet?: SSet;

    testSet2?: TSet<E>;

    error?: RoomNotFoundException;

    aa?: base.aa;
}

/** *1 */
export class RoomNotFoundException extends TException {
    constructor(data: { reason?: TString }) {
        super();
        if (data.reason != null) this.reason = TString(data.reason);
    }

    reason?: TString;
}

export type $null = TMap<TString, TBinary>;
export const $null = TMap<TString, TBinary>;
const x = new $null();
export type aa = base.aa;
export const aa = base.aa;

/** Unix time in microseconds */
export type $let = TDouble;
export const $let = TDouble;

/** Unix time in microseconds */
export type Date3 = $let;
export const Date3 = $let;

/** Unix time in microseconds */
export type Date4 = Date3;
export const Date4 = Date3;

/** typedef map */
export type Dic = TMap<TString, TString>;
export const Dic = TMap as TMapConstructor<TString, TString, Dic>;

/** typedef set */
export type SSet = TSet<E>;
export const SSet = TSet as TSetConstructor<E, SSet>;

/** typedef array */
export type SListtemp = TList<TString>;
export const SListtemp = TList as TListConstructor<TString, SListtemp>;

/** typedef array */
export type SList = SListtemp;
export const SList = SListtemp;

export type RoomInfo2 = RoomInfo;
export const RoomInfo2 = RoomInfo;

export const a: TString = 'x//12\'\n#xx1""';

export const a2: TString = "x//12'\n#xx1\n";

export const $typeof: TBinary = TBinary('keyword\b');

export const b: TI32 = 18;

export const id: TString = 'id';

export const y: RoomInfo = new RoomInfo({
    [id]: a,
    expires: 123,
    username: 'user1',
    password: 'pass',
    error: {
        reason: 'error',
    },
});

export const mm: TMap<TString, TMap<TString, TBinary>> = new TMap<TString, TMap<TString, TBinary>>([
    [
        'id',
        new TMap<TString, TBinary>([
            ['id', $typeof],
            ['typeof', TBinary('keyword')],
            ['expires', TBinary('')],
            ['username', TBinary('user1')],
            ['password', TBinary('pass')],
        ]),
    ],
    [
        'typeof',
        new TMap<TString, TBinary>([
            ['id', $typeof],
            ['typeof', TBinary('keyword')],
            ['expires', TBinary('')],
            ['username', TBinary('user1')],
            ['password', TBinary('pass')],
        ]),
    ],
]);

export const lc: TList<TI32> = [1, 2, 3];

export const lc2: SList = ['1', '2', '3'];

export const mc: TMap<TString, TBinary> = new TMap<TString, TBinary>([
    [a, TBinary('typeof')],
    ['id', $typeof],
    ['typeof', TBinary('keyword')],
    ['expires', TBinary('')],
    ['username', TBinary('user1')],
    ['password', TBinary('pass')],
]);

export const mc2: Dic = new TMap<TString, TString>([
    ['id', a],
    ['expires', ''],
    ['username', 'user1'],
    ['password', 'pass'],
]);

export const $true: $null = new TMap<TString, TBinary>([
    ['id', $typeof],
    ['typeof', TBinary('keyword')],
    ['expires', TBinary('')],
    ['username', TBinary('user1')],
    ['password', TBinary('pass')],
]);

export const sc: TSet<TI32> = new TSet<TI32>([1, 2, 3]);

export const sc2: SSet = new TSet<E>([1, 2]);

export const epoch: $let = 0;

/** rtc room service */
export abstract class RoomService extends TService {
    /** create a new room */
    abstract create(): Promise<RoomInfo>;

    /**
     * find existing room
     * @param id
     */
    abstract get(id: TString): Promise<RoomInfo>;

    /** find existing room */
    abstract lists(): Promise<TList<RoomInfo>>;

    /** find existing room */
    abstract list2(): Promise<TSet<RoomInfo>>;

    /**
     * find existing room
     * @throws {RoomNotFoundException} e2
     */
    abstract list3(): Promise<TMap<RoomInfo, TMap<RoomInfo, RoomInfo>>>;

    /**
     *
     * @param id
     * @throws {RoomNotFoundException} e
     */
    abstract remove(id: TString): Promise<void>;

    /**
     *
     * @param id
     */
    abstract update(id: TString): Promise<void>;

    /**
     *
     * @param id
     */
    abstract pppbool(id: TBool): Promise<TBool>;
}

/** rtc room service */
export abstract class RoomService2 extends RoomService {
    /**
     * create a new room
     * @param b
     */
    abstract b(b: TBinary): Promise<TBinary>;

    /**
     *
     * @param c - input
     * @throws {RoomNotFoundException} e why not
     */
    abstract c(c: $Promise): Promise<$Promise>;
}