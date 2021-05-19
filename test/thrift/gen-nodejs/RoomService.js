//
// Autogenerated by Thrift Compiler (0.14.1)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
'use strict';

const thrift = require('thrift');
const Thrift = thrift.Thrift;
const Int64 = require('node-int64');

const ttypes = require('./room_types');
//HELPER FUNCTIONS AND STRUCTURES

const RoomService_create_args = class {
    constructor(args) {}

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            input.skip(ftype);
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_create_args');
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_create_result = class {
    constructor(args) {
        this.success = null;
        if (args) {
            if (args.success !== undefined && args.success !== null) {
                this.success = new ttypes.RoomInfo(args.success);
            }
        }
    }

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            const fid = ret.fid;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 0:
                    if (ftype == Thrift.Type.STRUCT) {
                        this.success = new ttypes.RoomInfo();
                        this.success.read(input);
                    } else {
                        input.skip(ftype);
                    }
                    break;
                case 0:
                    input.skip(ftype);
                    break;
                default:
                    input.skip(ftype);
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_create_result');
        if (this.success !== null && this.success !== undefined) {
            output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
            this.success.write(output);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_get_args = class {
    constructor(args) {
        this.id = null;
        if (args) {
            if (args.id !== undefined && args.id !== null) {
                this.id = args.id;
            }
        }
    }

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            const fid = ret.fid;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 1:
                    if (ftype == Thrift.Type.STRING) {
                        this.id = input.readString();
                    } else {
                        input.skip(ftype);
                    }
                    break;
                case 0:
                    input.skip(ftype);
                    break;
                default:
                    input.skip(ftype);
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_get_args');
        if (this.id !== null && this.id !== undefined) {
            output.writeFieldBegin('id', Thrift.Type.STRING, 1);
            output.writeString(this.id);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_get_result = class {
    constructor(args) {
        this.success = null;
        if (args) {
            if (args.success !== undefined && args.success !== null) {
                this.success = new ttypes.RoomInfo(args.success);
            }
        }
    }

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            const fid = ret.fid;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 0:
                    if (ftype == Thrift.Type.STRUCT) {
                        this.success = new ttypes.RoomInfo();
                        this.success.read(input);
                    } else {
                        input.skip(ftype);
                    }
                    break;
                case 0:
                    input.skip(ftype);
                    break;
                default:
                    input.skip(ftype);
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_get_result');
        if (this.success !== null && this.success !== undefined) {
            output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
            this.success.write(output);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_remove_args = class {
    constructor(args) {
        this.id = null;
        if (args) {
            if (args.id !== undefined && args.id !== null) {
                this.id = args.id;
            }
        }
    }

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            const fid = ret.fid;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 1:
                    if (ftype == Thrift.Type.STRING) {
                        this.id = input.readString();
                    } else {
                        input.skip(ftype);
                    }
                    break;
                case 0:
                    input.skip(ftype);
                    break;
                default:
                    input.skip(ftype);
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_remove_args');
        if (this.id !== null && this.id !== undefined) {
            output.writeFieldBegin('id', Thrift.Type.STRING, 1);
            output.writeString(this.id);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_remove_result = class {
    constructor(args) {}

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            input.skip(ftype);
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_remove_result');
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_update_args = class {
    constructor(args) {
        this.id = null;
        if (args) {
            if (args.id !== undefined && args.id !== null) {
                this.id = args.id;
            }
        }
    }

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            const fid = ret.fid;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            switch (fid) {
                case 1:
                    if (ftype == Thrift.Type.STRING) {
                        this.id = input.readString();
                    } else {
                        input.skip(ftype);
                    }
                    break;
                case 0:
                    input.skip(ftype);
                    break;
                default:
                    input.skip(ftype);
            }
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_update_args');
        if (this.id !== null && this.id !== undefined) {
            output.writeFieldBegin('id', Thrift.Type.STRING, 1);
            output.writeString(this.id);
            output.writeFieldEnd();
        }
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomService_update_result = class {
    constructor(args) {}

    read(input) {
        input.readStructBegin();
        while (true) {
            const ret = input.readFieldBegin();
            const ftype = ret.ftype;
            if (ftype == Thrift.Type.STOP) {
                break;
            }
            input.skip(ftype);
            input.readFieldEnd();
        }
        input.readStructEnd();
        return;
    }

    write(output) {
        output.writeStructBegin('RoomService_update_result');
        output.writeFieldStop();
        output.writeStructEnd();
        return;
    }
};
const RoomServiceClient = (exports.Client = class RoomServiceClient {
    constructor(output, pClass) {
        this.output = output;
        this.pClass = pClass;
        this._seqid = 0;
        this._reqs = {};
    }
    seqid() {
        return this._seqid;
    }
    new_seqid() {
        return (this._seqid += 1);
    }

    create() {
        this._seqid = this.new_seqid();
        const self = this;
        return new Promise((resolve, reject) => {
            self._reqs[self.seqid()] = (error, result) => {
                return error ? reject(error) : resolve(result);
            };
            self.send_create();
        });
    }

    send_create() {
        const output = new this.pClass(this.output);
        const args = new RoomService_create_args();
        try {
            output.writeMessageBegin('create', Thrift.MessageType.CALL, this.seqid());
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        } catch (e) {
            delete this._reqs[this.seqid()];
            if (typeof output.reset === 'function') {
                output.reset();
            }
            throw e;
        }
    }

    recv_create(input, mtype, rseqid) {
        const callback = this._reqs[rseqid] || function () {};
        delete this._reqs[rseqid];
        if (mtype == Thrift.MessageType.EXCEPTION) {
            const x = new Thrift.TApplicationException();
            x.read(input);
            input.readMessageEnd();
            return callback(x);
        }
        const result = new RoomService_create_result();
        result.read(input);
        input.readMessageEnd();

        if (null !== result.success) {
            return callback(null, result.success);
        }
        return callback('create failed: unknown result');
    }

    get(id) {
        this._seqid = this.new_seqid();
        const self = this;
        return new Promise((resolve, reject) => {
            self._reqs[self.seqid()] = (error, result) => {
                return error ? reject(error) : resolve(result);
            };
            self.send_get(id);
        });
    }

    send_get(id) {
        const output = new this.pClass(this.output);
        const params = {
            id: id,
        };
        const args = new RoomService_get_args(params);
        try {
            output.writeMessageBegin('get', Thrift.MessageType.CALL, this.seqid());
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        } catch (e) {
            delete this._reqs[this.seqid()];
            if (typeof output.reset === 'function') {
                output.reset();
            }
            throw e;
        }
    }

    recv_get(input, mtype, rseqid) {
        const callback = this._reqs[rseqid] || function () {};
        delete this._reqs[rseqid];
        if (mtype == Thrift.MessageType.EXCEPTION) {
            const x = new Thrift.TApplicationException();
            x.read(input);
            input.readMessageEnd();
            return callback(x);
        }
        const result = new RoomService_get_result();
        result.read(input);
        input.readMessageEnd();

        if (null !== result.success) {
            return callback(null, result.success);
        }
        return callback('get failed: unknown result');
    }

    remove(id) {
        this._seqid = this.new_seqid();
        const self = this;
        return new Promise((resolve, reject) => {
            self._reqs[self.seqid()] = (error, result) => {
                return error ? reject(error) : resolve(result);
            };
            self.send_remove(id);
        });
    }

    send_remove(id) {
        const output = new this.pClass(this.output);
        const params = {
            id: id,
        };
        const args = new RoomService_remove_args(params);
        try {
            output.writeMessageBegin('remove', Thrift.MessageType.CALL, this.seqid());
            args.write(output);
            output.writeMessageEnd();
            return this.output.flush();
        } catch (e) {
            delete this._reqs[this.seqid()];
            if (typeof output.reset === 'function') {
                output.reset();
            }
            throw e;
        }
    }

    recv_remove(input, mtype, rseqid) {
        const callback = this._reqs[rseqid] || function () {};
        delete this._reqs[rseqid];
        if (mtype == Thrift.MessageType.EXCEPTION) {
            const x = new Thrift.TApplicationException();
            x.read(input);
            input.readMessageEnd();
            return callback(x);
        }
        const result = new RoomService_remove_result();
        result.read(input);
        input.readMessageEnd();

        callback(null);
    }

    update(id) {
        this._seqid = this.new_seqid();
        const self = this;
        return new Promise((resolve, reject) => {
            self._reqs[self.seqid()] = (error, result) => {
                return error ? reject(error) : resolve(result);
            };
            self.send_update(id);
        });
    }

    send_update(id) {
        const output = new this.pClass(this.output);
        const params = {
            id: id,
        };
        const args = new RoomService_update_args(params);
        try {
            output.writeMessageBegin('update', Thrift.MessageType.ONEWAY, this.seqid());
            args.write(output);
            output.writeMessageEnd();
            this.output.flush();
            const callback = this._reqs[this.seqid()] || function () {};
            delete this._reqs[this.seqid()];
            callback(null);
        } catch (e) {
            delete this._reqs[this.seqid()];
            if (typeof output.reset === 'function') {
                output.reset();
            }
            throw e;
        }
    }
});
const RoomServiceProcessor = (exports.Processor = class RoomServiceProcessor {
    constructor(handler) {
        this._handler = handler;
    }
    process(input, output) {
        const r = input.readMessageBegin();
        if (this['process_' + r.fname]) {
            return this['process_' + r.fname].call(this, r.rseqid, input, output);
        } else {
            input.skip(Thrift.Type.STRUCT);
            input.readMessageEnd();
            const x = new Thrift.TApplicationException(
                Thrift.TApplicationExceptionType.UNKNOWN_METHOD,
                'Unknown function ' + r.fname,
            );
            output.writeMessageBegin(r.fname, Thrift.MessageType.EXCEPTION, r.rseqid);
            x.write(output);
            output.writeMessageEnd();
            output.flush();
        }
    }
    process_create(seqid, input, output) {
        const args = new RoomService_create_args();
        args.read(input);
        input.readMessageEnd();
        if (this._handler.create.length === 0) {
            Promise.resolve(this._handler.create.bind(this._handler)())
                .then((result) => {
                    const result_obj = new RoomService_create_result({ success: result });
                    output.writeMessageBegin('create', Thrift.MessageType.REPLY, seqid);
                    result_obj.write(output);
                    output.writeMessageEnd();
                    output.flush();
                })
                .catch((err) => {
                    let result;
                    result = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin('create', Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                });
        } else {
            this._handler.create((err, result) => {
                let result_obj;
                if (err === null || typeof err === 'undefined') {
                    result_obj = new RoomService_create_result(
                        err !== null || typeof err === 'undefined' ? err : { success: result },
                    );
                    output.writeMessageBegin('create', Thrift.MessageType.REPLY, seqid);
                } else {
                    result_obj = new Thrift.TApplicationException(
                        Thrift.TApplicationExceptionType.UNKNOWN,
                        err.message,
                    );
                    output.writeMessageBegin('create', Thrift.MessageType.EXCEPTION, seqid);
                }
                result_obj.write(output);
                output.writeMessageEnd();
                output.flush();
            });
        }
    }
    process_get(seqid, input, output) {
        const args = new RoomService_get_args();
        args.read(input);
        input.readMessageEnd();
        if (this._handler.get.length === 1) {
            Promise.resolve(this._handler.get.bind(this._handler)(args.id))
                .then((result) => {
                    const result_obj = new RoomService_get_result({ success: result });
                    output.writeMessageBegin('get', Thrift.MessageType.REPLY, seqid);
                    result_obj.write(output);
                    output.writeMessageEnd();
                    output.flush();
                })
                .catch((err) => {
                    let result;
                    result = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin('get', Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                });
        } else {
            this._handler.get(args.id, (err, result) => {
                let result_obj;
                if (err === null || typeof err === 'undefined') {
                    result_obj = new RoomService_get_result(
                        err !== null || typeof err === 'undefined' ? err : { success: result },
                    );
                    output.writeMessageBegin('get', Thrift.MessageType.REPLY, seqid);
                } else {
                    result_obj = new Thrift.TApplicationException(
                        Thrift.TApplicationExceptionType.UNKNOWN,
                        err.message,
                    );
                    output.writeMessageBegin('get', Thrift.MessageType.EXCEPTION, seqid);
                }
                result_obj.write(output);
                output.writeMessageEnd();
                output.flush();
            });
        }
    }
    process_remove(seqid, input, output) {
        const args = new RoomService_remove_args();
        args.read(input);
        input.readMessageEnd();
        if (this._handler.remove.length === 1) {
            Promise.resolve(this._handler.remove.bind(this._handler)(args.id))
                .then((result) => {
                    const result_obj = new RoomService_remove_result({ success: result });
                    output.writeMessageBegin('remove', Thrift.MessageType.REPLY, seqid);
                    result_obj.write(output);
                    output.writeMessageEnd();
                    output.flush();
                })
                .catch((err) => {
                    let result;
                    result = new Thrift.TApplicationException(Thrift.TApplicationExceptionType.UNKNOWN, err.message);
                    output.writeMessageBegin('remove', Thrift.MessageType.EXCEPTION, seqid);
                    result.write(output);
                    output.writeMessageEnd();
                    output.flush();
                });
        } else {
            this._handler.remove(args.id, (err, result) => {
                let result_obj;
                if (err === null || typeof err === 'undefined') {
                    result_obj = new RoomService_remove_result(
                        err !== null || typeof err === 'undefined' ? err : { success: result },
                    );
                    output.writeMessageBegin('remove', Thrift.MessageType.REPLY, seqid);
                } else {
                    result_obj = new Thrift.TApplicationException(
                        Thrift.TApplicationExceptionType.UNKNOWN,
                        err.message,
                    );
                    output.writeMessageBegin('remove', Thrift.MessageType.EXCEPTION, seqid);
                }
                result_obj.write(output);
                output.writeMessageEnd();
                output.flush();
            });
        }
    }
    process_update(seqid, input, output) {
        const args = new RoomService_update_args();
        args.read(input);
        input.readMessageEnd();
        this._handler.update(args.id);
    }
});
