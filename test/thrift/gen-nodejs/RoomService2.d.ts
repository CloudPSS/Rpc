/// <reference path="RoomService.d.ts" />
//
// Autogenerated by Thrift Compiler (0.14.2)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//

import thrift = require('thrift');
import Thrift = thrift.Thrift;
import Q = thrift.Q;
import Int64 = require('node-int64');

import ttypes = require('./room_types');
import RoomInfo = ttypes.RoomInfo;
import RoomService = require('./RoomService');

/**
 * rtc room service
 */
declare class Client extends RoomService.Client {
    constructor(output: thrift.TTransport, pClass: { new (trans: thrift.TTransport): thrift.TProtocol });

    /**
     * create a new room
     */
    create2(): Promise<RoomInfo>;

    /**
     * create a new room
     */
    create2(callback?: (error: void, response: RoomInfo) => void): void;
}

declare class Processor extends RoomService.Processor {
    constructor(handler: object);
    process(input: thrift.TProtocol, output: thrift.TProtocol): void;
    process_create2(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
}