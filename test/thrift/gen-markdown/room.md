# Thrift module: room

| Module | Services & Functions                            | Data types                   | Constants |
| ------ | ----------------------------------------------- | ---------------------------- | --------- |
| room   | [RoomService](#service-roomservice)             | [RoomInfo](#struct-roominfo) |           |
|        | [ &bull; create](#function-roomservicecreate)   |                              |           |
|        | [ &bull; get](#function-roomserviceget)         |                              |           |
|        | [ &bull; remove](#function-roomserviceremove)   |                              |           |
|        | [ &bull; update](#function-roomserviceupdate)   |                              |           |
|        | [ &bull; pppbool](#function-roomservicepppbool) |                              |           |
|        | [RoomService2](#service-roomservice2)           |                              |           |
|        | [ &bull; b](#function-roomservice2b)            |                              |           |

---

## Data structures

### Struct: RoomInfo

rtc room info

| Key | Field    | Type     | Description                  | Requiredness | Default value |
| --- | -------- | -------- | ---------------------------- | ------------ | ------------- |
| 1   | id       | `string` | id of room                   | default      |               |
| 2   | expires  | `double` | expire time in epoch seconds | default      |               |
| 3   | username | `string` | COTURN username              | default      |               |
| 4   | password | `string` | COTURN password              | optional     |               |

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

#### Function: RoomService.remove

`void`
_remove_(`string` id)

#### Function: RoomService.update

`void`
_update_(`string` id)

#### Function: RoomService.pppbool

`bool`
_pppbool_(`bool` id)

### Service: RoomService2

**extends ** _[`RoomService`](#service-roomservice)_
rtc room service

#### Function: RoomService2.b

create a new room

`binary`
_b_(`binary` b)
