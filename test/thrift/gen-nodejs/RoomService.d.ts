//
// Autogenerated by Thrift Compiler (0.20.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//

import thrift = require('thrift');
import Thrift = thrift.Thrift;
import Q = thrift.Q;
import Int64 = require('node-int64');

import ttypes = require('./room_types');
import RoomInfo = ttypes.RoomInfo;

/**
 * rtc room service
 */
declare class Client {
    private output: thrift.TTransport;
    private pClass: thrift.TProtocol;
    private _seqid: number;

    constructor(output: thrift.TTransport, pClass: { new (trans: thrift.TTransport): thrift.TProtocol });

    /**
     * create a new room
     */
    create(): Promise<RoomInfo>;

    /**
     * create a new room
     */
    create(callback: (error: void, response: RoomInfo) => void): void;

    /**
     * find existing room
     */
    get(id: string): Promise<RoomInfo>;

    /**
     * find existing room
     */
    get(id: string, callback: (error: void, response: RoomInfo) => void): void;

    remove(id: string): Promise<void>;

    remove(id: string, callback: (error: void, response: void) => void): void;

    update(id: string): Promise<void>;

    update(id: string, callback: (error: void, response: void) => void): void;

    pppbool(id: boolean): Promise<boolean>;

    pppbool(id: boolean, callback: (error: void, response: boolean) => void): void;
}

declare class Processor {
    private _handler: object;

    constructor(handler: object);
    process(input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_create(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_get(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_remove(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_update(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_pppbool(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
}
