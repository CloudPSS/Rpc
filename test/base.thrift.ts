/****************************************************************/
/* Autogenerated on 2022-04-21T08:06:57.384Z with @cloudpss/rpc */
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


export class aa extends TStruct {
    constructor(data: {

        a?: TByte;
    }) {
        super();
        if (data.a != null)
            this.a = TByte(data.a);
    }

    a?: TByte;
}
