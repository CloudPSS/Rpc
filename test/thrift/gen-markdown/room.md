# Thrift module: room

Unix time in microseconds

| Module | Services & Functions                            | Data types                                                | Constants |
| ------ | ----------------------------------------------- | --------------------------------------------------------- | --------- |
| room   | [RoomService](#service-roomservice)             | [Date](#typedef-date)                                     |           |
|        | [ &bull; create](#function-roomservicecreate)   | [RoomInfo](#struct-roominfo)                              |           |
|        | [ &bull; get](#function-roomserviceget)         | [RoomNotFoundException](#exception-roomnotfoundexception) |           |
|        | [ &bull; lists](#function-roomservicelists)     |                                                           |           |
|        | [ &bull; pppbool](#function-roomservicepppbool) |                                                           |           |

---

## Type declarations

### Typedef: Date

Unix time in microseconds

_Base type_: **`double`**

---

## Data structures

### Struct: RoomInfo

rtc room info

| Key | Field    | Type                    | Description                  | Requiredness | Default value |
| --- | -------- | ----------------------- | ---------------------------- | ------------ | ------------- |
| 1   | id       | `string`                | id of room                   | default      |               |
| 2   | expires  | [`Date`](#typedef-date) | expire time in epoch seconds | default      |               |
| 3   | username | `string`                | COTURN username              | required     |               |
| 4   | password | `string`                | COTURN password              | optional     |               |

### Exception: RoomNotFoundException

| Key | Field  | Type     | Description | Requiredness | Default value |
| --- | ------ | -------- | ----------- | ------------ | ------------- |
| 1   | reason | `string` |             | default      |               |

---

## Services

### Service: RoomService

rtc room service

#### Function: RoomService.create

create a new room

[`RoomInfo`](#struct-roominfo)
_create_()

#### Function: RoomService.get

find existing room

[`RoomInfo`](#struct-roominfo)
_get_(`string` id)

#### Function: RoomService.lists

find existing room

list&lt;[`RoomInfo`](#struct-roominfo)&gt;
_lists_()

#### Function: RoomService.pppbool

`bool`
_pppbool_(`bool` id)
